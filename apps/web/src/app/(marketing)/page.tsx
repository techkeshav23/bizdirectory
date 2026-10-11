import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { CategoryDto, LocationDto } from '@/lib/types';
import { SearchBar } from '@/components/layout/SearchBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { publicEnv } from '@/env';

export const revalidate = 3600;

export default async function HomePage() {
  const [categories, cities] = await Promise.all([
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 86400, tags: ['cities'] }).catch(
      () => [],
    ),
  ]);

  return (
    <div className="space-y-20">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'BizDirectory',
          url: publicEnv.siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${publicEnv.siteUrl}/search?q={query}`,
            'query-input': 'required name=query',
          },
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-line bg-card px-6 py-16 shadow-[var(--shadow-card)] sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-70 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(232,131,47,0.22), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(20,67,58,0.15), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-medium uppercase tracking-widest text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Direct contact · no middlemen
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Find the right business,
            <br />
            <span className="italic text-brand-500">reach them directly.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Discover verified suppliers, manufacturers and service providers across India. Call or
            WhatsApp them in one tap — no leads resold, ever.
          </p>
          <div className="mx-auto mt-9 max-w-2xl">
            <SearchBar big />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span>Popular:</span>
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <SectionHead
          eyebrow="Explore"
          title="Browse by category"
          href="/search"
          hrefLabel="See all"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group grain relative overflow-hidden rounded-card border border-line bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/60 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="mb-8 font-display text-3xl text-brand-500/30 transition-colors group-hover:text-brand-500">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-medium leading-snug text-ink">{c.name}</div>
              <span className="mt-1 inline-block text-sm text-muted transition-transform group-hover:translate-x-1">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section>
        <SectionHead eyebrow="Near you" title="Popular cities" />
        <div className="flex flex-wrap gap-3">
          {cities.map((c) => (
            <Link
              key={c.id}
              href={`/location/${c.slug}`}
              className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-600"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="grain overflow-hidden rounded-[1.75rem] bg-forest px-8 py-14 text-center text-paper sm:px-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Run a business? Get discovered.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[#c3d2cb]">
          List free in minutes, get a GSTIN-verified badge, and receive customer calls &amp;
          WhatsApp enquiries directly.
        </p>
        <Link
          href="/register"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-brand-500 px-8 font-medium text-white transition-colors hover:bg-brand-600"
        >
          List your business free
        </Link>
      </section>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">
          {eyebrow}
        </div>
        <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="text-sm font-medium text-ink-soft hover:text-brand-600">
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}
