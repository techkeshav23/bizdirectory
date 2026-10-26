import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import { publicEnv } from '@/env';
import { apiGet } from '@/lib/api';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const DEFAULT_TITLE = 'BizDirectory — Find & contact verified B2B businesses in India';
const DEFAULT_DESC =
  'Discover verified suppliers, manufacturers and service providers across India. Search by category and city, then call or WhatsApp businesses directly — no middlemen.';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  // Admin-editable SEO text (falls back to sensible defaults if unset/unreachable).
  const seo = await apiGet<Record<string, string | null>>('/settings/public', {
    revalidate: 300,
    tags: ['settings'],
  }).catch(() => ({}) as Record<string, string | null>);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: seo['seo.metaTitle'] || DEFAULT_TITLE,
      template: '%s | BizDirectory',
    },
    description: seo['seo.metaDescription'] || DEFAULT_DESC,
    openGraph: {
      type: 'website',
      siteName: 'BizDirectory',
      locale: 'en_IN',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
