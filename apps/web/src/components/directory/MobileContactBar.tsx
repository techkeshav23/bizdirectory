'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { telLink, waLink } from '@/lib/utils';

interface Props {
  businessId: string;
  businessName: string;
  phone: string;
  whatsapp: string | null;
}

function track(businessId: string, type: 'call' | 'whatsapp') {
  const payload = JSON.stringify({ businessId, type, source: 'profile_mobile_bar' });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
  } else {
    void fetch('/api/track', { method: 'POST', body: payload, keepalive: true });
  }
}

/** Sticky bottom action bar — mobile only. The primary conversion surface on phones. */
export function MobileContactBar({ businessId, businessName, phone, whatsapp }: Props) {
  const waText = `Hi, I found ${businessName} on BizDirectory and would like to enquire.`;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <a
        href={telLink(phone)}
        onClick={() => track(businessId, 'call')}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary text-sm font-semibold text-primary-foreground transition-[filter] active:translate-y-px hover:brightness-110"
      >
        <Phone className="size-4" />
        Call now
      </a>
      {whatsapp && (
        <a
          href={waLink(whatsapp, waText)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(businessId, 'whatsapp')}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-[#25D366] text-sm font-semibold text-white transition-colors active:translate-y-px hover:bg-[#1da851]"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      )}
    </div>
  );
}
