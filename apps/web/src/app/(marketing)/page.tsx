import Link from 'next/link';
import {
  ShieldCheck,
  PhoneCall,
  Ban,
  Lock,
  Factory,
  Package,
  Wrench,
  Boxes,
  Shirt,
  FlaskConical,
  Wheat,
  Sofa,
  Printer,
  Zap,
  Hammer,
  Truck,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { CategoryDto, LocationDto, SearchResponse } from '@/lib/types';
import { SearchBar } from '@/components/layout/SearchBar';
import { BusinessCard } from '@/components/directory/BusinessCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { publicEnv } from '@/env';

export const revalidate = 3600;

const CAT_ICONS: LucideIcon[] = [
  Factory, Package, Wrench, Boxes, Shirt, FlaskConical, Wheat, Sofa, Printer, Zap, Hammer, Truck,
];

const TRUST = [
  { icon: ShieldCheck, label: 'GSTIN-verified businesses' },
  { icon: PhoneCall, label: 'Direct call & WhatsApp' },
  { icon: Ban, label: 'No middlemen, no lead reselling' },
  { icon: Lock, label: 'We never sell your number' },
];

export default async function HomePage() {
  const [categories, cities, featured] = await Promise.all([
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 86400, tags: ['cities'] }).catch(
      () => [],
    ),
    apiGet<SearchResponse>('/search?sort=rating&limit=6', { revalidate: 1800 }).catch(() => ({
      items: [],
      nextCursor: null,
    })),
  ]);

  return (
    <div className="space-y-16">
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
      <section className="pt-10 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" /> India&apos;s direct B2B discovery platform
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Find verified businesses.
          <br />
          <span className="text-primary">Contact them directly.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Search suppliers, manufacturers and service providers by category and city — then call or
          WhatsApp them in one tap. No middlemen, no pay-to-contact.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBar big />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <Lock className="mr-1 inline size-3" /> We never sell or re-route your number.
        </p>
      </section>

      {/* Trust strip */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background-2">
        <div className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-2.5 px-5 py-4">
              <t.icon className="size-5 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <SectionHead eyebrow="Explore" title="Browse by category" href="/search" hrefLabel="See all" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 12).map((c, i) => {
            const Icon = CAT_ICONS[i % CAT_ICONS.length]!;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground">View suppliers</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Verified / featured businesses */}
      {featured.items.length > 0 && (
        <section>
          <SectionHead eyebrow="Top rated" title="Featured businesses" href="/search" hrefLabel="Browse all" />
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.items.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      )}

      {/* Popular cities */}
      <section>
        <SectionHead eyebrow="Near you" title="Popular cities" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cities.map((c) => (
            <Link
              key={c.id}
              href={`/location/${c.slug}`}
              className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
            >
              {c.name}
              <ArrowRight className="size-4 text-muted-foreground/40" />
            </Link>
          ))}
        </div>
      </section>

      {/* Value band */}
      <section className="overflow-hidden rounded-[var(--radius-card)] bg-primary px-8 py-12 text-center text-primary-foreground sm:px-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Run a business? Get discovered.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
          List free in minutes, get a GSTIN-verified badge, and receive customer calls &amp;
          WhatsApp enquiries directly — no commission, no lead reselling.
        </p>
        <Link
          href="/register"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-card px-7 font-semibold text-primary transition-transform hover:-translate-y-0.5"
        >
          List your business — Free <ArrowRight className="size-4" />
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
    <div className="mb-5 flex items-end justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          {hrefLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
