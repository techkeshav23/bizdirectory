import { z } from 'zod';

const serverEnvSchema = z.object({
  API_INTERNAL_URL: z.string().url().default('http://localhost:4000/api'),
  REVALIDATE_SECRET: z.string().default('dev_revalidate_secret_change_me'),
});

export const serverEnv = serverEnvSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
});

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  waCountryCode: process.env.NEXT_PUBLIC_WA_COUNTRY_CODE ?? '91',
};
