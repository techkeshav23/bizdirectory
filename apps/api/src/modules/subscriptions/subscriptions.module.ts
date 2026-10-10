import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PaymentsService],
})
export class SubscriptionsModule {}
