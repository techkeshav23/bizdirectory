'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, Phone, MessageCircle, Eye, Plus } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/directory/VerifiedBadge';
import {
  PageHeader,
  StatCard,
  StatSkeleton,
  DataTable,
  EmptyState,
  ErrorState,
  type Column,
} from '@/components/shared';

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

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success',
  pending_review: 'warning',
  suspended: 'destructive',
  rejected: 'destructive',
  draft: 'muted',
};

export default function ManagePage() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await clientApi<OwnerData>('GET', '/dashboard/owner'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leads = data?.leads30d ?? {};
  const totalLeads = Object.values(leads).reduce((a, b) => a + b, 0);

  const columns: Column<OwnerBusiness>[] = [
    {
      key: 'name',
      header: 'Business',
      cell: (b) => (
        <div className="flex items-center gap-2 font-medium text-foreground">
          {b.name}
          <VerifiedBadge status={b.gstinStatus} />
          {b.subscriptionTier === 'gold' && <Badge variant="warning">Gold</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <Badge variant={STATUS_VARIANT[b.status] ?? 'muted'}>{b.status.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      align: 'right',
      hideOnMobile: true,
      accessor: (b) => b.viewCount,
      sortable: true,
      cell: (b) => <span className="tabular-nums text-muted-foreground">{b.viewCount}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-3 text-sm">
          <Link href={`/manage/${b.id}`} className="font-medium text-primary hover:underline">
            Manage
          </Link>
          {b.status === 'active' && (
            <Link href={`/business/${b.slug}`} className="text-muted-foreground hover:text-foreground">
              View
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={Store}
        title="Your businesses"
        description="Manage your listings, products and customer enquiries."
        actions={
          <Button href="/register">
            <Plus /> Add business
          </Button>
        }
      />

      {loading && !data ? (
        <StatSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Businesses" value={data?.businesses.length ?? 0} icon={Store} />
          <StatCard label="Enquiries (30d)" value={totalLeads} icon={MessageCircle} />
          <StatCard label="Calls" value={leads.call ?? 0} icon={Phone} />
          <StatCard label="WhatsApp" value={leads.whatsapp ?? 0} icon={MessageCircle} />
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : !loading && data && data.businesses.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No businesses yet"
            description="List your first business to start receiving customer enquiries."
            action={<Button href="/register">List a business</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data?.businesses ?? []}
            isLoading={loading}
            getRowKey={(b) => b.id}
          />
        )}
      </div>
    </div>
  );
}
