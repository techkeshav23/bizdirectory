'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

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

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<AdminBusiness[]>([]);
  const [filter, setFilter] = useState('pending_review');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    setStats(await clientApi<Stats>('GET', '/admin/stats'));
    setList(await clientApi<AdminBusiness[]>('GET', `/admin/businesses?status=${filter}`));
  }

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function moderate(id: string, status: string) {
    setBusy(id);
    try {
      await clientApi('PATCH', `/admin/businesses/${id}/status`, { status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  if (error)
    return (
      <div className="rounded-card border border-slate-200 bg-white p-6">
        <p className="text-muted">Admin access required.</p>
        <Button href="/login?next=/admin" className="mt-4">
          Admin login
        </Button>
      </div>
    );

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
        Admin panel
      </h1>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Businesses" value={stats.businesses} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Products" value={stats.products} />
          <Stat label="Users" value={stats.users} />
          <Stat label="Leads" value={stats.contactEvents} />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {['pending_review', 'active', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === s ? 'bg-brand-500 text-white' : 'bg-white text-muted border border-slate-200'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-slate-200 bg-white p-4"
          >
            <div>
              <h3 className="font-semibold">{b.name}</h3>
              <p className="text-sm text-muted">
                {b.primaryCategory.name} · {b.location.name} · {b.owner.phone} · GSTIN:{' '}
                {b.gstinStatus}
              </p>
            </div>
            <div className="flex gap-2">
              {b.status !== 'active' && (
                <Button size="sm" disabled={busy === b.id} onClick={() => moderate(b.id, 'active')}>
                  Approve
                </Button>
              )}
              {b.status !== 'suspended' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === b.id}
                  onClick={() => moderate(b.id, 'suspended')}
                >
                  Suspend
                </Button>
              )}
              {b.status !== 'rejected' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === b.id}
                  onClick={() => moderate(b.id, 'rejected')}
                >
                  Reject
                </Button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
            Nothing here.
          </p>
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
