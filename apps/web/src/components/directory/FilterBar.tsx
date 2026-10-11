'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top rated' },
  { value: 'recent', label: 'Newest' },
];

export function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const sort = sp.get('sort') ?? 'relevance';
  const verified = sp.get('verified') === 'true';
  const hasFilters = sp.get('q') || sp.get('city') || sp.get('category') || verified || sort !== 'relevance';

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground">Sort</Label>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-36">
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
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="verified"
          checked={verified}
          onCheckedChange={(c) => update({ verified: c ? 'true' : null })}
        />
        <Label htmlFor="verified" className="cursor-pointer">
          Verified only
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => router.push('/search')}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
