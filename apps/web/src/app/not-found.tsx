import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-7xl font-semibold tracking-tight text-brand-500">404</div>
      <p className="mt-4 font-display text-2xl text-ink">This page wandered off.</p>
      <p className="mt-2 text-muted">The listing you&apos;re looking for may have moved or been removed.</p>
      <Link
        href="/"
        className="mt-7 inline-flex h-11 items-center rounded-full bg-ink px-6 font-medium text-paper transition-colors hover:bg-ink/85"
      >
        Back to home
      </Link>
    </div>
  );
}
