import type { MetadataRoute } from 'next';
import { apiGet } from '@/lib/api';
import type { CategoryDto, LocationDto } from '@/lib/types';
import { publicEnv } from '@/env';

export const revalidate = 3600;

/**
 * Phase-1 sitemap: static + category/city combinations. When business/product
 * counts grow past 50k URLs, split this into a sitemap index + sharded routes
 * under /sitemaps/[type]/[chunk] (see PHASE_1_PLAN.md).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const [categories, cities] = await Promise.all([
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600 }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 86400 }).catch(() => []),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, priority: 1 },
    { url: `${base}/about`, priority: 0.3 },
  ];

  const categoryUrls = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    priority: 0.7,
  }));

  const cityUrls = cities.map((c) => ({
    url: `${base}/location/${c.slug}`,
    priority: 0.6,
  }));

  const comboUrls: MetadataRoute.Sitemap = [];
  for (const cat of categories) {
    for (const city of cities) {
      comboUrls.push({ url: `${base}/category/${cat.slug}/${city.slug}`, priority: 0.8 });
    }
  }

  return [...staticUrls, ...categoryUrls, ...cityUrls, ...comboUrls];
}
