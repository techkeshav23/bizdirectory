'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Clock,
  Package,
  Users as UsersIcon,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifiedBadge } from '@/components/directory/VerifiedBadge';
import {
  PageHeader,
  StatCard,
  StatSkeleton,
  DataTable,
  ConfirmDialog,
  ErrorState,
  type Column,
} from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface AdminBusiness {
  id: string;
  name: string;
  status: string;
  gstinStatus: string;
  location: { name: string };
  primaryCategory: { name: string };
  owner: { phone: string };
}
interface Stats {
  businesses: number;
  pending: number;
  products: number;
  users: number;
  contactEvents: number;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success',
  pending_review: 'warning',
  suspended: 'destructive',
  rejected: 'destructive',
  draft: 'muted',
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<AdminBusiness[]>([]);
  const [filter, setFilter] = useState('pending_review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reject, setReject] = useState<AdminBusiness | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l] = await Promise.all([
        clientApi<Stats>('GET', '/admin/stats'),
        clientApi<AdminBusiness[]>('GET', `/admin/businesses?status=${filter}`),
      ]);
      setStats(s);
      setList(l);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id: string, status: string, name: string) {
    setBusy(true);
    try {
      await clientApi('PATCH', `/admin/businesses/${id}/status`, { status });
      toast.success(`"${name}" ${status === 'active' ? 'approved' : status}`);
      setReject(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<AdminBusiness>[] = [
    {
      key: 'name',
      header: 'Business',
      cell: (b) => (
        <div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            {b.name}
            <VerifiedBadge status={b.gstinStatus} />
          </div>
          <div className="text-xs text-muted-foreground">{b.owner.phone}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideOnMobile: true,
      cell: (b) => <span className="text-muted-foreground">{b.primaryCategory.name}</span>,
    },
    {
      key: 'location',
      header: 'City',
      hideOnMobile: true,
      cell: (b) => <span className="text-muted-foreground">{b.location.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <Badge variant={STATUS_VARIANT[b.status] ?? 'muted'}>{b.status.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-1.5">
          {b.status !== 'active' && (
            <Button size="sm" disabled={busy} onClick={() => moderate(b.id, 'active', b.name)}>
              Approve
            </Button>
          )}
          {b.status !== 'suspended' && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => moderate(b.id, 'suspended', b.name)}
            >
              Suspend
            </Button>
          )}
          {b.status !== 'rejected' && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReject(b)}>
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={ShieldCheck}
        title="Admin"
        description="Moderate listings and manage the platform."
      />

      {loading && !stats ? (
        <StatSkeleton count={5} />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Businesses" value={stats.businesses} icon={Building2} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Products" value={stats.products} icon={Package} />
          <StatCard label="Users" value={stats.users} icon={UsersIcon} />
          <StatCard label="Leads" value={stats.contactEvents} icon={MessageSquare} />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="pending_review">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            data={list}
            isLoading={loading}
            getRowKey={(b) => b.id}
            empty={<span className="text-muted-foreground">Nothing in this queue.</span>}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!reject}
        onOpenChange={(o) => !o && setReject(null)}
        title={`Reject "${reject?.name ?? ''}"?`}
        description="The business owner will need to resubmit. You can approve it later."
        confirmLabel="Reject"
        variant="destructive"
        isSubmitting={busy}
        onConfirm={() => reject && moderate(reject.id, 'rejected', reject.name)}
      />
    </div>
  );
}
