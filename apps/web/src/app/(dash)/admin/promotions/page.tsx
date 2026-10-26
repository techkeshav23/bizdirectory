'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, Star, Sparkles } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageHeader, DataTable, ErrorState, type Column } from '@/components/shared';
import { toast } from '@/components/ui/sonner';

interface Biz {
  id: string;
  name: string;
  status: string;
  isFeatured: boolean;
  isSponsored: boolean;
  subscriptionTier: string | null;
  location: { name: string } | null;
  primaryCategory: { name: string } | null;
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await clientApi<Biz[]>('GET', '/admin/businesses'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((b) => b.name.toLowerCase().includes(term));
  }, [items, q]);

  async function toggle(b: Biz, key: 'isFeatured' | 'isSponsored', value: boolean) {
    setBusyId(b.id);
    try {
      await clientApi('PATCH', `/admin/businesses/${b.id}/promotion`, { [key]: value });
      setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, [key]: value } : x)));
      toast.success('Promotion updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const featuredCount = items.filter((b) => b.isFeatured).length;
  const sponsoredCount = items.filter((b) => b.isSponsored).length;

  const columns: Column<Biz>[] = [
    {
      key: 'name',
      header: 'Business',
      cell: (b) => (
        <div>
          <div className="font-medium text-foreground">{b.name}</div>
          <div className="text-xs text-muted-foreground">
            {b.primaryCategory?.name ?? '—'} · {b.location?.name ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      hideOnMobile: true,
      cell: (b) => <Badge variant="muted">{b.subscriptionTier ?? 'free'}</Badge>,
    },
    {
      key: 'featured',
      header: 'Featured',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={b.isFeatured}
            disabled={busyId === b.id}
            onCheckedChange={(v) => toggle(b, 'isFeatured', v)}
          />
          {b.isFeatured && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
        </div>
      ),
    },
    {
      key: 'sponsored',
      header: 'Sponsored',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={b.isSponsored}
            disabled={busyId === b.id}
            onCheckedChange={(v) => toggle(b, 'isSponsored', v)}
          />
          {b.isSponsored && <Sparkles className="size-3.5 text-primary" />}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        icon={Megaphone}
        title="Promotions"
        description="Feature or sponsor listings. Sponsored placements are labelled on the site."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Badge variant="warning">{featuredCount} featured</Badge>
          <Badge variant="success">{sponsoredCount} sponsored</Badge>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search business…"
          className="h-9 w-full sm:w-64"
        />
      </div>

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          getRowKey={(b) => b.id}
          empty={<span className="text-muted-foreground">No businesses yet.</span>}
        />
      )}
    </div>
  );
}
