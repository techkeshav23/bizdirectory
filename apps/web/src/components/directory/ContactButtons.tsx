'use client';

import { telLink, waLink } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface Props {
  businessId: string;
  businessName: string;
  phone: string;
  whatsapp: string | null;
  productName?: string;
}

function track(businessId: string, type: 'call' | 'whatsapp' | 'view_phone', productId?: string) {
  const payload = JSON.stringify({ businessId, type, source: 'profile', productId });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
  } else {
    void fetch('/api/track', { method: 'POST', body: payload, keepalive: true });
  }
}

export function ContactButtons({ businessId, businessName, phone, whatsapp, productName }: Props) {
  const waText = productName
    ? `Hi, I found ${businessName} on BizDirectory and I'm interested in "${productName}".`
    : `Hi, I found ${businessName} on BizDirectory and would like to enquire.`;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Direct one-tap call — no reveal step, consistent with the mobile bar. */}
      <Button variant="primary" href={telLink(phone)} onClick={() => track(businessId, 'call')}>
        📞 Call {phone}
      </Button>

      {whatsapp && (
        <a
          href={waLink(whatsapp, waText)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(businessId, 'whatsapp')}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#1da851]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.519 5.26l-.999 3.648 3.569-.635z" />
          </svg>
          WhatsApp
        </a>
      )}
    </div>
  );
}
