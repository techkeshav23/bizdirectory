import type { Metadata } from 'next';
import Link from 'next/link';
import { tagCity } from '@app/types';
import { apiGet } from '@/lib/api';
import type { CategoryDto, SearchResponse } from '@/lib/types';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LoadMoreBusinesses } from '@/components/directory/LoadMoreBusinesses';

export const revalidate = 21600;

function toTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const name = toTitle(city);
  const data = await apiGet<SearchResponse>(`/search?city=${city}&limit=1`, {
    revalidate: 21600,
    tags: [tagCity(city)],
  }).catch(() => ({ items: [], nextCursor: null, total: 0 }));
  const indexable = (data.total ?? 0) >= 5;
  return {
    title: `Businesses in ${name}`,
    description: `Discover verified B2B businesses, suppliers and service providers in ${name}. Contact them directly on BizDirectory.`,
    alternates: { canonical: `/location/${city}` },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const name = toTitle(city);
  const [data, categories] = await Promise.all([
    apiGet<SearchResponse>(`/search?city=${city}`, {
      revalidate: 21600,
      tags: [tagCity(city)],
    }).catch(() => ({ items: [], nextCursor: null, total: 0 })),
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(() => []),
  ]);

  return (
    <div className="animate-rise">
      <Breadcrumbs items={[{ name, href: `/location/${city}` }]} />
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">City</div>
      <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight text-foreground">
        Businesses in {name}
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        {data.total ?? data.items.length} businesses listed
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}/${city}`}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {data.items.length > 0 ? (
        <LoadMoreBusinesses
          initialItems={data.items}
          initialCursor={data.nextCursor}
          query={`city=${city}`}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card p-14 text-center">
          <div className="font-display text-2xl text-foreground">No businesses in {name} yet</div>
          <p className="mt-2 text-muted-foreground">Check back soon — or list yours.</p>
        </div>
      )}
    </div>
  );
}
