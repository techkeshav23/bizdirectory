import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac } from 'node:crypto';
import type { Env } from '../../config/env';

export interface CreatedOrder {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  mock: boolean;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  get isMock(): boolean {
    const provider = this.config.get('PAYMENTS_PROVIDER', { infer: true });
    const keyId = this.config.get('RAZORPAY_KEY_ID', { infer: true });
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET', { infer: true });
    return provider !== 'razorpay' || !keyId || !keySecret;
  }

  async createOrder(amountInr: number, receipt: string): Promise<CreatedOrder> {
    const amount = Math.round(amountInr * 100);
    if (this.isMock) {
      return {
        orderId: `mock_order_${receipt}_${amount}`,
        amount,
        currency: 'INR',
        keyId: 'mock',
        mock: true,
      };
    }

    const keyId = this.config.get('RAZORPAY_KEY_ID', { infer: true })!;
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET', { infer: true })!;
    const { data } = await axios.post(
      'https://api.razorpay.com/v1/orders',
      // notes.receipt lets the webhook resolve business+plan from payment.captured too.
      { amount, currency: 'INR', receipt, notes: { receipt } },
      { auth: { username: keyId, password: keySecret } },
    );
    return { orderId: data.id, amount, currency: 'INR', keyId, mock: false };
  }

  /** Verifies the Razorpay payment signature. Always true in mock mode. */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (this.isMock) return true;
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET', { infer: true })!;
    const expected = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }
}
