'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

interface Props {
  businessId: string;
  businessName: string;
  currentTier?: string | null;
  onDone?: () => void;
}

interface CheckoutResp {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  mock: boolean;
  planSlug: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const PLANS = [
  { slug: 'silver', name: 'Silver', note: 'Verified badge · 3 categories · analytics' },
  { slug: 'gold', name: 'Gold', note: 'Featured + sponsored placement · priority support' },
];

export function UpgradeDialog({ businessId, businessName, currentTier, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function upgrade(planSlug: string) {
    setBusy(planSlug);
    setMsg('');
    try {
      const order = await clientApi<CheckoutResp>('POST', '/subscriptions/checkout', {
        businessId,
        planSlug,
      });

      // Mock mode: no real gateway, activate directly.
      if (order.mock) {
        await verify(planSlug, order.orderId, `mock_pay_${order.orderId}`, 'mock_sig');
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error('Could not load payment gateway');

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BizDirectory',
        description: `${PLANS.find((p) => p.slug === planSlug)?.name} plan — ${businessName}`,
        order_id: order.orderId,
        handler: (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          void verify(
            planSlug,
            resp.razorpay_order_id,
            resp.razorpay_payment_id,
            resp.razorpay_signature,
          );
        },
        theme: { color: '#2563eb' },
      });
      rzp.open();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy('');
    }
  }

  async function verify(
    planSlug: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    try {
      const res = await clientApi<{ tier: string }>('POST', '/subscriptions/verify', {
        businessId,
        planSlug,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      setMsg(`Upgraded to ${res.tier}! 🎉`);
      setBusy('');
      onDone?.();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy('');
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {currentTier && currentTier !== 'free' ? `Plan: ${currentTier}` : 'Upgrade'}
      </Button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-border bg-muted p-3">
      {msg && <div className="mb-2 text-sm text-brand-600">{msg}</div>}
      <div className="flex flex-col gap-2">
        {PLANS.map((p) => (
          <div key={p.slug} className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted">{p.note}</div>
            </div>
            <Button size="sm" disabled={busy !== ''} onClick={() => upgrade(p.slug)}>
              {busy === p.slug ? 'Processing…' : 'Choose'}
            </Button>
          </div>
        ))}
        <button
          onClick={() => setOpen(false)}
          className="mt-1 text-xs text-muted hover:text-ink"
        >
          Close
        </button>
      </div>
    </div>
  );
}
