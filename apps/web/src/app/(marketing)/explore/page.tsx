import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { CategoryDto, LocationDto } from '@/lib/types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Explore businesses by category & city',
  description:
    'Browse verified B2B businesses across India by category and city. Find suppliers, manufacturers and service providers and contact them directly.',
  alternates: { canonical: '/explore' },
};

export default async function ExplorePage() {
  const [categories, cities] = await Promise.all([
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 3600, tags: ['cities'] }).catch(
      () => [],
    ),
  ]);
  const topCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="animate-rise">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Explore</div>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
        Browse the directory
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Pick a category or city to find verified businesses and contact them directly.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topCategories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex items-center justify-between rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40"
            >
              {c.name}
              <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Cities</h2>
        <div className="flex flex-wrap gap-2.5">
          {cities.map((c) => (
            <Link
              key={c.id}
              href={`/location/${c.slug}`}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
