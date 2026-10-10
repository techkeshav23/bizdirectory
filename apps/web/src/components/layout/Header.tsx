import Link from 'next/link';
import { SearchBar } from './SearchBar';

function Wordmark() {
  return (
    <Link href="/" className="shrink-0 leading-none">
      <span className="font-display text-[1.6rem] font-semibold tracking-tight text-ink">
        Biz<span className="italic text-brand-500">Directory</span>
      </span>
    </Link>
  );
}

export function Header({ withSearch = true }: { withSearch?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3.5">
        <Wordmark />
        {withSearch && (
          <div className="hidden flex-1 lg:block">
            <SearchBar />
          </div>
        )}
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/pricing"
            className="hidden rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/register"
            className="hidden rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink md:inline"
          >
            List your business
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-2 font-medium text-paper transition-colors hover:bg-ink/85"
          >
            Login
          </Link>
        </nav>
      </div>
      {withSearch && (
        <div className="border-t border-line/60 px-4 py-2.5 lg:hidden">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
