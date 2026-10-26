'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import type { CategoryDto, LocationDto } from '@/lib/types';

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top rated' },
  { value: 'recent', label: 'Newest' },
];

const ALL = 'all';

export function FilterBar({
  categories = [],
  cities = [],
}: {
  categories?: CategoryDto[];
  cities?: LocationDto[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const sort = sp.get('sort') ?? 'relevance';
  const category = sp.get('category') ?? '';
  const city = sp.get('city') ?? '';
  const verified = sp.get('verified') === 'true';
  const hasFilters =
    Boolean(category) || Boolean(city) || verified || sort !== 'relevance';

  const topCategories = categories.filter((c) => !c.parentId);

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === ALL) params.delete(k);
      else params.set(k, v);
    }
    router.push(`/search?${params.toString()}`);
  }

  function clearAll() {
    const q = sp.get('q');
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="size-4 text-primary" />
        Filters
      </div>

      <div className="space-y-4">
        <Group label="Category">
          <Select
            value={category || ALL}
            onValueChange={(v) => update({ category: v })}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {topCategories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Group>

        <Group label="City">
          <Select value={city || ALL} onValueChange={(v) => update({ city: v })}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Group>

        <Group label="Sort by">
          <Select value={sort} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Group>

        <div className="flex items-center justify-between rounded-[var(--radius)] border border-border/60 bg-background/50 px-3.5 py-3">
          <Label htmlFor="verified" className="cursor-pointer text-sm">
            GSTIN verified only
          </Label>
          <Switch
            id="verified"
            checked={verified}
            onCheckedChange={(c) => update({ verified: c ? 'true' : null })}
          />
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
