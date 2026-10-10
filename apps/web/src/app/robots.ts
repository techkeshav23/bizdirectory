import type { MetadataRoute } from 'next';
import { publicEnv } from '@/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/search', '/login', '/register', '/dashboard', '/manage', '/admin', '/api/'],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
