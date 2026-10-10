import type { Metadata } from 'next';
import { apiGet } from '@/lib/api';
import type { SearchResponse } from '@/lib/types';
import { BusinessCard } from '@/components/directory/BusinessCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search businesses',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const key of ['q', 'category', 'city', 'sort', 'verified'] as const) {
    if (sp[key]) qs.set(key, sp[key]!);
  }

  const data = await apiGet<SearchResponse>(`/search?${qs.toString()}`).catch(() => ({
    items: [],
    nextCursor: null,
  }));

  return (
    <div className="animate-rise">
      <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">Search</div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">
        {sp.q ? `“${sp.q}”` : 'All businesses'}
      </h1>
      <p className="mb-7 mt-1 text-ink-soft">
        {data.items.length} business{data.items.length === 1 ? '' : 'es'} found
        {sp.city ? ` in ${sp.city}` : ''}
      </p>

      {data.items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white p-14 text-center">
          <div className="font-display text-2xl text-ink">Nothing here yet</div>
          <p className="mt-2 text-muted">Try a different keyword or city.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
