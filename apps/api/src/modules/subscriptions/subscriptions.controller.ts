import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  checkoutSchema,
  verifyPaymentSchema,
  type CheckoutDto,
  type VerifyPaymentDto,
} from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, Roles, type AuthUser } from '../../common/decorators';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.subscriptions.listPlans();
  }

  @Roles('business_owner', 'admin')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser, @Query('businessId') businessId: string) {
    return this.subscriptions.mySubscription(user.id, businessId);
  }

  @Roles('business_owner', 'admin')
  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(checkoutSchema)) dto: CheckoutDto,
  ) {
    return this.subscriptions.checkout(user.id, dto.businessId, dto.planSlug);
  }

  @Roles('business_owner', 'admin')
  @Post('verify')
  verify(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) dto: VerifyPaymentDto,
  ) {
    return this.subscriptions.verifyAndActivate(
      user.id,
      dto.businessId,
      dto.planSlug,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }
}
