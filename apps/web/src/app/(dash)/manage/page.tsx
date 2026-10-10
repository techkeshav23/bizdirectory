'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/directory/VerifiedBadge';
import { UpgradeDialog } from '@/components/billing/UpgradeDialog';

interface OwnerBusiness {
  id: string;
  name: string;
  slug: string;
  status: string;
  gstinStatus: string;
  subscriptionTier?: string | null;
  viewCount: number;
}
interface OwnerData {
  businesses: OwnerBusiness[];
  leads30d: Record<string, number>;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending_review: 'bg-amber-50 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function ManagePage() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [error, setError] = useState('');

  function load() {
    void clientApi<OwnerData>('GET', '/dashboard/owner')
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    load();
  }, []);

  if (error)
    return (
      <div className="rounded-card border border-slate-200 bg-white p-6">
        <p className="text-muted">Please log in to manage your business.</p>
        <Button href="/login?next=/manage" className="mt-4">
          Login
        </Button>
      </div>
    );
  if (!data) return <p className="text-muted">Loading…</p>;

  const totalLeads = Object.values(data.leads30d).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Your businesses
        </h1>
        <Button href="/register">+ Add business</Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Businesses" value={data.businesses.length} />
        <Stat label="Leads (30d)" value={totalLeads} />
        <Stat label="Calls" value={data.leads30d.call ?? 0} />
        <Stat label="WhatsApp" value={data.leads30d.whatsapp ?? 0} />
      </div>

      <div className="space-y-3">
        {data.businesses.map((b) => (
          <div key={b.id} className="rounded-card border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{b.name}</h3>
                  <VerifiedBadge status={b.gstinStatus} />
                  {b.subscriptionTier === 'gold' && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      GOLD
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ''}`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                  <span>{b.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/manage/${b.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Manage →
                </Link>
                {b.status === 'active' && (
                  <Link href={`/business/${b.slug}`} className="text-sm text-muted hover:text-ink">
                    View
                  </Link>
                )}
              </div>
            </div>
            <UpgradeDialog
              businessId={b.id}
              businessName={b.name}
              currentTier={b.subscriptionTier}
              onDone={load}
            />
          </div>
        ))}
        {data.businesses.length === 0 && (
          <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
            You haven&apos;t added a business yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4">
      <div className="text-2xl font-bold text-brand-600">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
