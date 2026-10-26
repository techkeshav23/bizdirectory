import type { MetadataRoute } from 'next';
import { apiGet } from '@/lib/api';
import { publicEnv } from '@/env';

export const revalidate = 3600;

interface Landing {
  categories: string[];
  cities: string[];
  combos: { category: string; city: string }[];
}

/**
 * Sitemap emits only indexable pages: static routes + category/city/combo landing
 * pages that have >=5 active listings (the API gates this). This avoids flooding
 * search engines with thin or empty pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const landing = await apiGet<Landing>('/search/landing', { revalidate: 3600 }).catch(() => ({
    categories: [],
    cities: [],
    combos: [],
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, priority: 1 },
    { url: `${base}/explore`, priority: 0.8 },
    { url: `${base}/how-it-works`, priority: 0.5 },
    { url: `${base}/pricing`, priority: 0.5 },
    { url: `${base}/contact`, priority: 0.4 },
    { url: `${base}/about`, priority: 0.3 },
    { url: `${base}/privacy`, priority: 0.2 },
    { url: `${base}/terms`, priority: 0.2 },
    { url: `${base}/disclaimer`, priority: 0.2 },
  ];

  const categoryUrls = landing.categories.map((slug) => ({
    url: `${base}/category/${slug}`,
    priority: 0.7,
  }));
  const cityUrls = landing.cities.map((slug) => ({
    url: `${base}/location/${slug}`,
    priority: 0.6,
  }));
  const comboUrls = landing.combos.map(({ category, city }) => ({
    url: `${base}/category/${category}/${city}`,
    priority: 0.8,
  }));

  return [...staticUrls, ...categoryUrls, ...cityUrls, ...comboUrls];
}
