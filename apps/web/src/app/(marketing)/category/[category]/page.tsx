import type { Metadata } from 'next';
import { tagCategory } from '@app/types';
import { apiGet } from '@/lib/api';
import type { SearchResponse } from '@/lib/types';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { BusinessCard } from '@/components/directory/BusinessCard';

export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = toTitle(category);
  return {
    title: `${name} — verified suppliers & businesses`,
    description: `Find verified ${name} across India. Browse listings and contact businesses directly via call or WhatsApp.`,
    alternates: { canonical: `/category/${category}` },
  };
}

function toTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const name = toTitle(category);
  const data = await apiGet<SearchResponse>(`/search?category=${category}`, {
    revalidate: 21600,
    tags: [tagCategory(category)],
  }).catch(() => ({ items: [], nextCursor: null }));

  return (
    <div className="animate-rise">
      <Breadcrumbs items={[{ name, href: `/category/${category}` }]} />
      <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">Category</div>
      <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight text-ink">{name}</h1>
      <p className="mb-7 mt-1 text-ink-soft">{data.items.length} businesses listed</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.items.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
      {data.items.length === 0 && (
        <div className="rounded-card border border-dashed border-line bg-white p-14 text-center">
          <div className="font-display text-2xl text-ink">No businesses yet</div>
          <p className="mt-2 text-muted">Check back soon — or list yours.</p>
        </div>
      )}
    </div>
  );
}
