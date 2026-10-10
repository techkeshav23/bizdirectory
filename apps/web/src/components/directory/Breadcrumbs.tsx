import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { publicEnv } from '@/env';

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: 'Home', href: '/' }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-line">/</span>}
              {i < all.length - 1 ? (
                <Link href={c.href} className="transition-colors hover:text-brand-600">
                  {c.name}
                </Link>
              ) : (
                <span className="font-medium text-ink">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: `${publicEnv.siteUrl}${c.href}`,
          })),
        }}
      />
    </>
  );
}
