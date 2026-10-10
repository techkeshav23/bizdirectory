import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { tagBusiness } from '@app/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { PaymentsService, type CreatedOrder } from './payments.service';

interface Entitlements {
  tier: string;
  isFeatured: boolean;
  isSponsored: boolean;
  durationDays: number;
}

/** Maps a plan slug to what the business gets. */
function entitlementsFor(slug: string): Entitlements {
  switch (slug) {
    case 'gold':
      return { tier: 'gold', isFeatured: true, isSponsored: true, durationDays: 30 };
    case 'silver':
      return { tier: 'silver', isFeatured: false, isSponsored: false, durationDays: 30 };
    default:
      return { tier: 'free', isFeatured: false, isSponsored: false, durationDays: 0 };
  }
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly revalidate: RevalidateService,
  ) {}

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async checkout(
    ownerId: string,
    businessId: string,
    planSlug: string,
  ): Promise<CreatedOrder & { planSlug: string }> {
    const business = await this.ownedOrThrow(ownerId, businessId);
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (Number(plan.price) <= 0) {
      throw new BadRequestException('Free plan does not require checkout');
    }
    const order = await this.payments.createOrder(
      Number(plan.price),
      `${business.publicId}_${plan.slug}`,
    );
    return { ...order, planSlug: plan.slug };
  }

  async verifyAndActivate(
    ownerId: string,
    businessId: string,
    planSlug: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<{ activated: true; tier: string }> {
    await this.ownedOrThrow(ownerId, businessId);
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new NotFoundException('Plan not found');

    const ok = this.payments.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!ok) throw new BadRequestException('Payment signature verification failed');

    const ent = entitlementsFor(plan.slug);
    const now = new Date();
    const endsAt = new Date(now.getTime() + ent.durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.businessSubscription.create({
        data: {
          businessId,
          planId: plan.id,
          status: 'active',
          startedAt: now,
          endsAt,
        },
      }),
      this.prisma.business.update({
        where: { id: businessId },
        data: {
          subscriptionTier: ent.tier,
          isFeatured: ent.isFeatured,
          isSponsored: ent.isSponsored,
        },
      }),
    ]);

    this.revalidate.revalidate([tagBusiness(businessId)]);
    return { activated: true, tier: ent.tier };
  }

  mySubscription(ownerId: string, businessId: string) {
    return this.prisma.businessSubscription.findFirst({
      where: { businessId, business: { ownerId }, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ownedOrThrow(ownerId: string, businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.deletedAt) throw new NotFoundException('Business not found');
    if (business.ownerId !== ownerId) throw new ForbiddenException('Not your business');
    return business;
  }
}
