import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  gstinOverrideSchema,
  moderateBusinessSchema,
  planUpsertSchema,
  promotionSchema,
  updateUserRoleSchema,
  type BusinessStatus,
  type GstinOverrideDto,
  type ModerateBusinessDto,
  type PlanUpsertDto,
  type PromotionDto,
  type UpdateUserRoleDto,
  type UserRole,
  type UserStatus,
} from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Roles, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { BusinessesService } from '../businesses/businesses.service';

@Roles('admin')
@Controller('admin')
class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  @Get('stats')
  async stats(): Promise<unknown> {
    const [businesses, pending, products, users, events] = await Promise.all([
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.business.count({ where: { status: 'pending_review', deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.contactEvent.count(),
    ]);
    return { businesses, pending, products, users, contactEvents: events };
  }

  @Get('businesses')
  async listBusinesses(@Query('status') status?: BusinessStatus): Promise<unknown> {
    return this.prisma.business.findMany({
      where: { ...(status ? { status } : {}), deletedAt: null },
      include: { owner: { select: { phone: true } }, location: true, primaryCategory: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Patch('businesses/:id/status')
  async moderate(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderateBusinessSchema)) dto: ModerateBusinessDto,
  ): Promise<unknown> {
    const before = await this.prisma.business.findUnique({
      where: { id },
      include: { location: true, primaryCategory: true },
    });
    const updated = await this.prisma.business.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.audit(admin.id, 'moderate_business', 'business', id, before, { status: dto.status, reason: dto.reason });
    this.businesses.revalidateBusiness(id, before?.location.slug, before?.primaryCategory.slug);
    return updated;
  }

  @Patch('businesses/:id/gstin')
  async overrideGstin(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(gstinOverrideSchema)) dto: GstinOverrideDto,
  ): Promise<unknown> {
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        gstinStatus: dto.status,
        legalName: dto.legalName,
        gstinVerifiedAt: dto.status === 'verified' || dto.status === 'manual' ? new Date() : null,
      },
    });
    await this.audit(admin.id, 'override_gstin', 'business', id, null, dto);
    this.businesses.revalidateBusiness(id);
    return updated;
  }

  @Get('reviews')
  async pendingReviews(@Query('status') status?: string): Promise<unknown> {
    return this.prisma.review.findMany({
      where: { status: (status as 'pending' | 'approved' | 'rejected') || 'pending' },
      include: {
        business: { select: { name: true, slug: true } },
        user: { select: { phone: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Patch('reviews/:id/status')
  async moderateReview(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Query('status') status: 'approved' | 'rejected' = 'approved',
  ): Promise<unknown> {
    const review = await this.prisma.review.update({
      where: { id },
      data: { status },
    });
    if (review.status === 'approved') await this.recomputeRating(review.businessId);
    await this.audit(admin.id, 'moderate_review', 'review', id, null, { status });
    return review;
  }

  @Get('audit-logs')
  async auditLogs(@Query('entityType') entityType?: string): Promise<unknown> {
    return this.prisma.auditLog.findMany({
      where: entityType ? { entityType } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('users')
  async listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<unknown> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role ? { role: role as UserRole } : {}),
        ...(status ? { status: status as UserStatus } : {}),
        ...(q
          ? {
              OR: [
                { phone: { contains: q } },
                { fullName: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        isPhoneVerified: true,
        createdAt: true,
        _count: { select: { businesses: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Patch('users/:id')
  async updateUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema)) dto: UpdateUserRoleDto,
  ): Promise<unknown> {
    if (id === admin.id && (dto.status === 'blocked' || (dto.role && dto.role !== 'admin'))) {
      throw new BadRequestException('You cannot demote or block your own admin account.');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      select: { id: true, role: true, status: true },
    });
    await this.audit(admin.id, 'update_user', 'user', id, null, dto);
    return updated;
  }

  // --- Promotions: feature / sponsor a listing ---
  @Patch('businesses/:id/promotion')
  async promote(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(promotionSchema)) dto: PromotionDto,
  ): Promise<unknown> {
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.isSponsored !== undefined ? { isSponsored: dto.isSponsored } : {}),
      },
      select: { id: true, isFeatured: true, isSponsored: true },
    });
    await this.audit(admin.id, 'promote_business', 'business', id, null, dto);
    this.businesses.revalidateBusiness(id);
    return updated;
  }

  // --- Subscription plans (CRUD) ---
  @Get('plans')
  async listPlans(): Promise<unknown> {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        sortOrder: true,
        _count: { select: { subscriptions: true } },
      },
    });
  }

  @Post('plans')
  async createPlan(
    @Body(new ZodValidationPipe(planUpsertSchema)) dto: PlanUpsertDto,
  ): Promise<unknown> {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        price: dto.price,
        interval: dto.interval,
        features: dto.features,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(planUpsertSchema.partial())) dto: Partial<PlanUpsertDto>,
  ): Promise<unknown> {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  @Delete('plans/:id')
  async removePlan(@Param('id') id: string): Promise<{ ok: true }> {
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { ok: true };
  }

  @Get('subscriptions')
  async listSubscriptions(): Promise<unknown> {
    return this.prisma.businessSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        status: true,
        startedAt: true,
        endsAt: true,
        createdAt: true,
        business: { select: { name: true, slug: true } },
        plan: { select: { name: true, price: true } },
      },
    });
  }

  private async recomputeRating(businessId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { businessId, status: 'approved' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count._all,
      },
    });
  }

  private async audit(
    actorUserId: string,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        before: before ? JSON.parse(JSON.stringify(before)) : undefined,
        after: after ? JSON.parse(JSON.stringify(after)) : undefined,
      },
    });
  }
}

@Module({ imports: [BusinessesModule], controllers: [AdminController] })
export class AdminModule {}
