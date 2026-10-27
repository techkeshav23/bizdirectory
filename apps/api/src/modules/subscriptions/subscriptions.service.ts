import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { tagBusiness } from '@app/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import type { Env } from '../../config/env';
import { PaymentsService, type CreatedOrder } from './payments.service';

interface Entitlements {
  tier: string;
  isFeatured: boolean;
  isSponsored: boolean;
  durationDays: number;
}

/**
 * Maps a plan to what the business gets. Derived from price + slug keywords so
 * ANY plan set works (badge/sponsored/gold/silver/...) without a code change —
 * paid plans never silently fall back to free entitlements.
 */
function entitlementsFor(plan: { slug: string; price: unknown; interval?: string }): Entitlements {
  const slug = plan.slug.toLowerCase();
  const price = Number(plan.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { tier: 'free', isFeatured: false, isSponsored: false, durationDays: 0 };
  }
  const durationDays = plan.interval === 'yearly' ? 365 : 30;
  const sponsored = /gold|sponsor|premium|pro/.test(slug);
  const featured = sponsored || /silver|feature|badge|plus/.test(slug);
  return {
    tier: sponsored ? 'gold' : 'silver',
    isFeatured: featured,
    isSponsored: sponsored,
    durationDays,
  };
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly revalidate: RevalidateService,
    private readonly config: ConfigService<Env, true>,
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

    // Idempotency: a replayed /verify must not stack a second active subscription.
    const existing = await this.prisma.businessSubscription.findFirst({
      where: { businessId, planId: plan.id, status: 'active', endsAt: { gt: new Date() } },
      select: { id: true },
    });
    if (existing) return { activated: true, tier: entitlementsFor(plan).tier };

    const tier = await this.applyPlan(businessId, plan);
    return { activated: true, tier };
  }

  /** Activate a plan on a business (shared by client-verify and webhook). */
  private async applyPlan(
    businessId: string,
    plan: { id: string; slug: string; price: unknown; interval?: string },
  ): Promise<string> {
    const ent = entitlementsFor(plan);
    const now = new Date();
    const endsAt = new Date(now.getTime() + ent.durationDays * 24 * 60 * 60 * 1000);
    await this.prisma.$transaction([
      this.prisma.businessSubscription.create({
        data: { businessId, planId: plan.id, status: 'active', startedAt: now, endsAt },
      }),
      this.prisma.business.update({
        where: { id: businessId },
        data: { subscriptionTier: ent.tier, isFeatured: ent.isFeatured, isSponsored: ent.isSponsored },
      }),
    ]);
    this.revalidate.revalidate(['business', tagBusiness(businessId)]);
    return ent.tier;
  }

  /** Daily job: expire lapsed subscriptions and downgrade the business to free. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireDue(): Promise<void> {
    const now = new Date();
    const due = await this.prisma.businessSubscription.findMany({
      where: { status: 'active', endsAt: { lt: now } },
      select: { id: true, businessId: true },
    });
    if (due.length === 0) return;
    for (const sub of due) {
      await this.prisma.businessSubscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      // Only downgrade if no other active (unexpired) subscription remains.
      const stillActive = await this.prisma.businessSubscription.findFirst({
        where: { businessId: sub.businessId, status: 'active', endsAt: { gt: now } },
        select: { id: true },
      });
      if (!stillActive) {
        await this.prisma.business.update({
          where: { id: sub.businessId },
          data: { subscriptionTier: 'free', isFeatured: false, isSponsored: false },
        });
        this.revalidate.revalidate(['business', tagBusiness(sub.businessId)]);
      }
    }
    this.logger.log(`Expired ${due.length} subscription(s)`);
  }

  /** Razorpay webhook: verify signature, then activate idempotently server-side. */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: true }> {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET', { infer: true });
    if (!secret) {
      this.logger.warn('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set');
      return { received: true };
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const sig = Buffer.from(signature);
    const exp = Buffer.from(expected);
    if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: {
      event?: string;
      payload?: {
        order?: { entity?: { receipt?: string } };
        payment?: { entity?: { notes?: { receipt?: string } } };
      };
    };
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return { received: true }; // signed but malformed — ack so Razorpay stops retrying
    }
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const receipt =
        event.payload?.order?.entity?.receipt ?? event.payload?.payment?.entity?.notes?.receipt;
      if (receipt) await this.activateByReceipt(receipt);
    }
    return { received: true };
  }

  /** receipt is `${business.publicId}_${plan.slug}` (set in checkout). */
  private async activateByReceipt(receipt: string): Promise<void> {
    const idx = receipt.indexOf('_');
    if (idx < 1) return;
    const publicId = receipt.slice(0, idx);
    const planSlug = receipt.slice(idx + 1);
    const [business, plan] = await Promise.all([
      this.prisma.business.findUnique({ where: { publicId } }),
      this.prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } }),
    ]);
    if (!business || !plan) return;
    const existing = await this.prisma.businessSubscription.findFirst({
      where: { businessId: business.id, planId: plan.id, status: 'active', endsAt: { gt: new Date() } },
      select: { id: true },
    });
    if (existing) return; // idempotent — already activated
    await this.applyPlan(business.id, plan);
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
