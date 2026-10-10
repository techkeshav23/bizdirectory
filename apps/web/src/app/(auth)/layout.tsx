import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { robots: { index: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-7 font-display text-3xl font-semibold tracking-tight text-ink">
        Biz<span className="italic text-brand-500">Directory</span>
      </Link>
      <div className="grain w-full max-w-md rounded-card border border-line bg-white p-7 shadow-[var(--shadow-lift)]">
        {children}
      </div>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-ink">
        ← Back to home
      </Link>
    </div>
  );
}
