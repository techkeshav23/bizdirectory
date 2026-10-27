import { Body, Controller, HttpCode, Module, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { contactEventSchema, type ContactEventDto } from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { hashIp } from '../../common/crypto.util';

@Controller('contact')
class ContactController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('events')
  @HttpCode(204)
  async record(
    @Body(new ZodValidationPipe(contactEventSchema)) dto: ContactEventDto,
    @Req() req: Request,
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      select: { id: true, status: true, deletedAt: true },
    });
    if (!business || business.deletedAt || business.status !== 'active') {
      return;
    }
    await this.prisma.contactEvent.create({
      data: {
        businessId: dto.businessId,
        userId: user?.id ?? null,
        type: dto.type,
        source: dto.source,
        productId: dto.productId,
        ipHash: hashIp(req.ip),
        userAgent: req.headers['user-agent']?.slice(0, 255),
      },
    });
    await this.redis.incr(`leads:${dto.businessId}:${dto.type}`);
  }
}

@Module({ controllers: [ContactController] })
export class ContactModule {}
