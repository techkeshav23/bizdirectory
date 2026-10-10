import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { maskPhone } from '../../common/crypto.util';
import type { Env } from '../../config/env';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const provider = this.config.get('SMS_PROVIDER', { infer: true });
    if (provider === 'msg91') {
      await this.sendViaMsg91(phone, code);
      return;
    }
    // console provider (dev): log the OTP so devs can log in without a gateway
    this.logger.log(`[DEV OTP] ${maskPhone(phone)} -> ${code}`);
  }

  private async sendViaMsg91(phone: string, code: string): Promise<void> {
    const authKey = this.config.get('MSG91_AUTH_KEY', { infer: true });
    const templateId = this.config.get('MSG91_OTP_TEMPLATE_ID', { infer: true });
    if (!authKey || !templateId) {
      this.logger.warn('MSG91 not configured; falling back to console OTP');
      this.logger.log(`[DEV OTP] ${maskPhone(phone)} -> ${code}`);
      return;
    }
    const mobile = phone.replace('+', '');
    await axios.post(
      'https://control.msg91.com/api/v5/otp',
      { template_id: templateId, mobile, otp: code },
      { headers: { authkey: authKey } },
    );
  }
}
