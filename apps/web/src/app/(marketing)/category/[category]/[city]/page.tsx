import type { Metadata } from 'next';
import { tagCategory, tagCity } from '@app/types';
import { apiGet } from '@/lib/api';
import type { SearchResponse } from '@/lib/types';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { BusinessCard } from '@/components/directory/BusinessCard';

// The "money pages": category × city. ISR; long tail generated on demand.
export const dynamicParams = true;
export const revalidate = 21600;

export function generateStaticParams() {
  return [] as { category: string; city: string }[];
}

function toTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}): Promise<Metadata> {
  const { category, city } = await params;
  const cat = toTitle(category);
  const cityName = toTitle(city);
  const title = `${cat} in ${cityName} — verified suppliers`;
  return {
    title,
    description: `Find the best ${cat} in ${cityName}. Compare verified businesses and contact them directly via call or WhatsApp on BizDirectory.`,
    alternates: { canonical: `/category/${category}/${city}` },
  };
}

export default async function CategoryCityPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}) {
  const { category, city } = await params;
  const cat = toTitle(category);
  const cityName = toTitle(city);
  const data = await apiGet<SearchResponse>(`/search?category=${category}&city=${city}`, {
    revalidate: 21600,
    tags: [tagCategory(category), tagCity(city)],
  }).catch(() => ({ items: [], nextCursor: null }));

  return (
    <div className="animate-rise">
      <Breadcrumbs
        items={[
          { name: cat, href: `/category/${category}` },
          { name: cityName, href: `/category/${category}/${city}` },
        ]}
      />
      <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">
        {cityName}
      </div>
      <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight text-ink">
        {cat} <span className="italic text-brand-500">in {cityName}</span>
      </h1>
      <p className="mb-7 mt-1 text-ink-soft">{data.items.length} businesses</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.items.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
      {data.items.length === 0 && (
        <div className="rounded-card border border-dashed border-line bg-white p-14 text-center">
          <div className="font-display text-2xl text-ink">
            No {cat} in {cityName} yet
          </div>
          <p className="mt-2 text-muted">Check back soon.</p>
        </div>
      )}
    </div>
  );
}
