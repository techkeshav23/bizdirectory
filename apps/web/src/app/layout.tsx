import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import { publicEnv } from '@/env';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

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

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: 'BizDirectory — Find & contact verified B2B businesses in India',
    template: '%s | BizDirectory',
  },
  description:
    'Discover verified suppliers, manufacturers and service providers across India. Search by category and city, then call or WhatsApp businesses directly — no middlemen.',
  openGraph: {
    type: 'website',
    siteName: 'BizDirectory',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
};

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
