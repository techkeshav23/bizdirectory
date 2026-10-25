'use client';

import Link from 'next/link';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CategoryDto } from '@/lib/types';

export function CategoryMenu({ categories }: { categories: CategoryDto[] }) {
  const top = categories.filter((c) => !c.parentId).slice(0, 15);
  if (top.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent md:inline-flex">
        <LayoutGrid className="size-4" />
        Categories
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="grid w-[min(92vw,620px)] grid-cols-2 gap-0.5 p-2 sm:grid-cols-3"
      >
        {top.map((c) => (
          <DropdownMenuItem key={c.id} asChild>
            <Link href={`/category/${c.slug}`} className="truncate">
              {c.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
