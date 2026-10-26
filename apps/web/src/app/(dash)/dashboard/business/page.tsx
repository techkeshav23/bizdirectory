'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  Eye,
  Phone,
  MessageCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, StatCard, StatSkeleton, ErrorState, EmptyState } from '@/components/shared';

interface OwnerBiz {
  id: string;
  name: string;
  slug: string;
  status: string;
  gstinStatus: string;
  subscriptionTier: string | null;
  viewCount: number;
}
interface OwnerData {
  businesses: OwnerBiz[];
  leads30d: Record<string, number>;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success',
  pending_review: 'warning',
  suspended: 'destructive',
  rejected: 'destructive',
  draft: 'muted',
};

export default function OwnerOverview() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await clientApi<OwnerData>('GET', '/dashboard/owner'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalViews = data?.businesses.reduce((s, b) => s + (b.viewCount || 0), 0) ?? 0;
  const calls = data?.leads30d.call ?? 0;
  const wa = data?.leads30d.whatsapp ?? 0;

  return (
    <div className="animate-rise">
      <PageHeader
        icon={LayoutDashboard}
        title="Business overview"
        description="Your listings and how customers are engaging with them."
        actions={
          <Button href="/manage">
            <Store className="size-4" /> Manage listings
          </Button>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : !data ? (
        <StatSkeleton count={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Listings" value={data.businesses.length} icon={Store} />
            <StatCard label="Profile views" value={totalViews} icon={Eye} />
            <StatCard label="Calls (30d)" value={calls} icon={Phone} />
            <StatCard label="WhatsApp (30d)" value={wa} icon={MessageCircle} />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Your listings</h2>
            {data.businesses.length === 0 ? (
              <EmptyState
                icon={Store}
                title="No listings yet"
                description="Create your first business listing to get discovered by customers."
                action={
                  <Button href="/register">
                    <Plus className="size-4" /> List your business
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.businesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/manage/${b.id}`}
                    className="group flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{b.name}</span>
                        <Badge variant={STATUS_VARIANT[b.status] ?? 'muted'}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {b.viewCount} views · {b.subscriptionTier ?? 'free'} plan
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
