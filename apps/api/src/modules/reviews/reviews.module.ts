import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { createReviewSchema, type CreateReviewDto } from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('businesses/:id/reviews')
class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(@Param('id') businessId: string): Promise<unknown> {
    return this.prisma.review.findMany({
      where: { businessId, status: 'approved' },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Param('id') businessId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
  ): Promise<unknown> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return this.prisma.review.upsert({
      where: { businessId_userId: { businessId, userId: user.id } },
      update: { rating: dto.rating, body: dto.body, status: 'pending' },
      create: { businessId, userId: user.id, rating: dto.rating, body: dto.body },
    });
  }
}

@Module({ controllers: [ReviewsController] })
export class ReviewsModule {}
