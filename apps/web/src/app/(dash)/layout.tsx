import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { robots: { index: false } };

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3.5">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
            Biz<span className="italic text-brand-500">Directory</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link
              href="/manage"
              className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              Business
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              Saved
            </Link>
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2 hover:text-ink"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
