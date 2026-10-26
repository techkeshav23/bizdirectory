import type { Metadata } from 'next';
import { Suspense } from 'react';
import { apiGet } from '@/lib/api';
import type { SearchResponse, CategoryDto, LocationDto } from '@/lib/types';
import { BusinessCard } from '@/components/directory/BusinessCard';
import { FilterBar } from '@/components/directory/FilterBar';
import { EmptyState } from '@/components/shared';
import { SearchX } from 'lucide-react';

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

  const [data, categories, cities] = await Promise.all([
    apiGet<SearchResponse>(`/search?${qs.toString()}`).catch(() => ({
      items: [],
      nextCursor: null,
    })),
    apiGet<CategoryDto[]>('/categories', { revalidate: 300 }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 300 }).catch(() => []),
  ]);

  return (
    <div className="animate-rise">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Search</div>
      <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground">
        {sp.q ? `“${sp.q}”` : 'All businesses'}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {data.items.length} business{data.items.length === 1 ? '' : 'es'} found
        {sp.city ? ` in ${sp.city}` : ''}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <Suspense fallback={null}>
            <FilterBar categories={categories} cities={cities} />
          </Suspense>
        </aside>

        <div>
          {data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nothing here yet"
              description="Try a different keyword, city, or clear your filters."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.items.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
