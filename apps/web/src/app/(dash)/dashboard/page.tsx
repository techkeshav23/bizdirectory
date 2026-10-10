'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

interface SavedBiz {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ratingAvg: string | number;
}

export default function CustomerDashboard() {
  const [saved, setSaved] = useState<SavedBiz[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void clientApi<{ saved: SavedBiz[] }>('GET', '/dashboard/customer')
      .then((d) => setSaved(d.saved))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error)
    return (
      <div className="rounded-card border border-slate-200 bg-white p-6">
        <p className="text-muted">Please log in to see your saved businesses.</p>
        <Button href="/login?next=/dashboard" className="mt-4">
          Login
        </Button>
      </div>
    );
  if (!saved) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">
        Saved businesses
      </h1>
      {saved.length === 0 ? (
        <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
          You haven&apos;t saved any businesses yet.{' '}
          <Link href="/" className="text-brand-600 hover:underline">
            Explore
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {saved.map((b) => (
            <Link
              key={b.id}
              href={`/business/${b.slug}`}
              className="rounded-card border border-slate-200 bg-white p-4 hover:shadow-md"
            >
              <h3 className="font-semibold">{b.name}</h3>
              <p className="text-sm text-muted">★ {Number(b.ratingAvg).toFixed(1)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
