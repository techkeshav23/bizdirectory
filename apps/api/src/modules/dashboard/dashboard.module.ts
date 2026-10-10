import { Body, Controller, Delete, Get, Module, Param, Post } from '@nestjs/common';
import { CurrentUser, Roles, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('dashboard')
class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('business_owner', 'admin')
  @Get('owner')
  async owner(@CurrentUser() user: AuthUser): Promise<unknown> {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        gstinStatus: true,
        subscriptionTier: true,
        viewCount: true,
      },
    });
    const ids = businesses.map((b) => b.id);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = ids.length
      ? await this.prisma.contactEvent.groupBy({
          by: ['type'],
          where: { businessId: { in: ids }, createdAt: { gte: since } },
          _count: { _all: true },
        })
      : [];
    const leads = Object.fromEntries(events.map((e) => [e.type, e._count._all]));
    return { businesses, leads30d: leads };
  }

  @Get('customer')
  async customer(@CurrentUser() user: AuthUser): Promise<unknown> {
    const saved = await this.prisma.savedBusiness.findMany({
      where: { userId: user.id },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true, ratingAvg: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { saved: saved.map((s) => s.business) };
  }

  @Post('saved/:businessId')
  async save(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ): Promise<{ ok: true }> {
    await this.prisma.savedBusiness.upsert({
      where: { userId_businessId: { userId: user.id, businessId } },
      update: {},
      create: { userId: user.id, businessId },
    });
    return { ok: true };
  }

  @Delete('saved/:businessId')
  async unsave(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ): Promise<{ ok: true }> {
    await this.prisma.savedBusiness.deleteMany({ where: { userId: user.id, businessId } });
    return { ok: true };
  }
}

@Module({ controllers: [DashboardController] })
export class DashboardModule {}
