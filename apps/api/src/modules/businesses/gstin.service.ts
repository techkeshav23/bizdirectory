import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Env } from '../../config/env';

export interface GstinResult {
  valid: boolean;
  legalName?: string;
  tradeName?: string;
  address?: string;
}

@Injectable()
export class GstinService {
  private readonly logger = new Logger(GstinService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async verify(gstin: string): Promise<GstinResult> {
    const provider = this.config.get('GSTIN_PROVIDER', { infer: true });
    if (provider === 'surepass') return this.verifyViaSurepass(gstin);
    return this.verifyMock(gstin);
  }

  private verifyMock(gstin: string): GstinResult {
    // Deterministic mock for dev: every format-valid GSTIN resolves as verified.
    return {
      valid: true,
      legalName: `Demo Enterprise (${gstin.slice(2, 7)})`,
      tradeName: 'Demo Traders',
      address: 'Mock address, India',
    };
  }

  private async verifyViaSurepass(gstin: string): Promise<GstinResult> {
    const base = this.config.get('GSTIN_API_BASE', { infer: true });
    const key = this.config.get('GSTIN_API_KEY', { infer: true });
    if (!base || !key) {
      this.logger.warn('GSTIN provider not configured; using mock');
      return this.verifyMock(gstin);
    }
    try {
      const { data } = await axios.post(
        `${base}/corporate/gstin`,
        { id_number: gstin },
        { headers: { Authorization: `Bearer ${key}` } },
      );
      const d = data?.data ?? {};
      return {
        valid: Boolean(d?.gstin),
        legalName: d?.legal_name,
        tradeName: d?.trade_name,
        address: d?.address,
      };
    } catch (err) {
      this.logger.error(`GSTIN verify failed: ${String(err)}`);
      return { valid: false };
    }
  }
}
