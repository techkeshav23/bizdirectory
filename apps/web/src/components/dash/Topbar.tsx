'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarNavList } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  isAdmin: boolean;
  isOwner: boolean;
}

export function Topbar({ isAdmin, isOwner }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile nav */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="flex h-14 items-center border-b border-border px-4">
            <Link href="/" className="font-display text-lg font-semibold">
              Biz<span className="italic text-primary">Directory</span>
            </Link>
          </SheetTitle>
          <SidebarNavList
            isAdmin={isAdmin}
            isOwner={isOwner}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ⌘K search trigger */}
      <button
        onClick={() => window.dispatchEvent(new Event('open-command'))}
        className="flex h-9 flex-1 items-center gap-2 rounded-full border border-border bg-background px-3.5 text-sm text-muted-foreground transition-colors hover:border-ring sm:max-w-xs"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View site →
        </Link>
      </div>
    </header>
  );
}
