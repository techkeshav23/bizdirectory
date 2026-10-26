'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Check, X, Star } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, ErrorState, EmptyState } from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface AdminReview {
  id: string;
  rating: number;
  body: string | null;
  status: string;
  createdAt: string;
  business: { name: string; slug: string };
  user: { phone: string; fullName: string | null };
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<AdminReview[]>('GET', `/admin/reviews?status=${status}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(r: AdminReview, newStatus: 'approved' | 'rejected') {
    setBusyId(r.id);
    try {
      await clientApi('PATCH', `/admin/reviews/${r.id}/status?status=${newStatus}`);
      toast.success(`Review ${newStatus}`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader
        icon={MessageSquare}
        title="Reviews"
        description="Moderate customer reviews before they appear publicly."
      />

      <Tabs value={status} onValueChange={setStatus} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Nothing here" description={`No ${status} reviews.`} />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < r.rating
                              ? 'size-3.5 fill-amber-400 text-amber-400'
                              : 'size-3.5 text-muted-foreground/30'
                          }
                        />
                      ))}
                    </span>
                    <Badge variant="muted">{r.business.name}</Badge>
                  </div>
                  {r.body && <p className="mt-2 text-sm text-foreground/90">{r.body}</p>}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {r.user.fullName ?? r.user.phone}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {status !== 'approved' && (
                    <Button size="sm" disabled={busyId === r.id} onClick={() => moderate(r, 'approved')}>
                      <Check className="size-3.5" /> Approve
                    </Button>
                  )}
                  {status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => moderate(r, 'rejected')}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
