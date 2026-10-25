import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { CategoryDto } from '@/lib/types';
import { SearchBar } from './SearchBar';
import { CategoryMenu } from './CategoryMenu';

function Wordmark() {
  return (
    <Link href="/" className="shrink-0 leading-none">
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Biz<span className="text-primary">Directory</span>
      </span>
    </Link>
  );
}

export async function Header({ withSearch = true }: { withSearch?: boolean }) {
  const categories = await apiGet<CategoryDto[]>('/categories', {
    revalidate: 3600,
    tags: ['categories'],
  }).catch(() => []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4">
        <Wordmark />
        <CategoryMenu categories={categories} />
        {withSearch && (
          <div className="hidden flex-1 lg:block">
            <SearchBar />
          </div>
        )}
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/pricing"
            className="hidden rounded-[var(--radius)] px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/register"
            className="hidden rounded-[var(--radius)] border border-border px-3.5 py-2 font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent md:inline"
          >
            List your business
          </Link>
          <Link
            href="/login"
            className="rounded-[var(--radius)] bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:brightness-110"
          >
            Login
          </Link>
        </nav>
      </div>
      {withSearch && (
        <div className="border-t border-border/60 px-4 py-2.5 lg:hidden">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
