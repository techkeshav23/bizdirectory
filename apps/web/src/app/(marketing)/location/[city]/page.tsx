import type { Metadata } from 'next';
import Link from 'next/link';
import { tagCity } from '@app/types';
import { apiGet } from '@/lib/api';
import type { CategoryDto, SearchResponse } from '@/lib/types';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { BusinessCard } from '@/components/directory/BusinessCard';

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
  return {
    title: `Businesses in ${name}`,
    description: `Discover verified B2B businesses, suppliers and service providers in ${name}. Contact them directly on BizDirectory.`,
    alternates: { canonical: `/location/${city}` },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const name = toTitle(city);
  const [data, categories] = await Promise.all([
    apiGet<SearchResponse>(`/search?city=${city}`, {
      revalidate: 21600,
      tags: [tagCity(city)],
    }).catch(() => ({ items: [], nextCursor: null })),
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(
      () => [],
    ),
  ]);

  return (
    <div className="animate-rise">
      <Breadcrumbs items={[{ name, href: `/location/${city}` }]} />
      <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">City</div>
      <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight text-ink">
        Businesses in {name}
      </h1>
      <p className="mb-6 mt-1 text-ink-soft">{data.items.length} businesses listed</p>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}/${city}`}
            className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.items.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
    </div>
  );
}
