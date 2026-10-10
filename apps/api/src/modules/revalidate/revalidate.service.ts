import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';

/**
 * Fires on-demand ISR revalidation on the Next.js web app whenever an
 * indexable entity changes. Fire-and-forget; never blocks the mutation.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);
  private readonly url?: string;
  private readonly secret?: string;

  constructor(config: ConfigService<Env, true>) {
    this.url = config.get('REVALIDATE_WEBHOOK_URL', { infer: true });
    this.secret = config.get('REVALIDATE_SECRET', { infer: true });
  }

  revalidate(tags: string[], paths: string[] = []): void {
    if (!this.url || !this.secret || tags.length === 0) return;
    void fetch(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': this.secret },
      body: JSON.stringify({ tags, paths }),
    }).catch((err) => this.logger.warn(`Revalidate failed: ${String(err)}`));
  }
}
