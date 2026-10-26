'use client';

import { useState } from 'react';
import { BusinessCard } from './BusinessCard';
import { Button } from '@/components/ui/Button';
import type { BusinessCardDto, SearchResponse } from '@/lib/types';

/**
 * Renders a business grid with cursor-based "Load more". The initial page is
 * server-rendered (SEO-friendly); subsequent pages fetch through the proxy.
 * `query` is the /search query string WITHOUT a cursor (e.g. "category=steel&city=pune").
 */
export function LoadMoreBusinesses({
  initialItems,
  initialCursor,
  query,
}: {
  initialItems: BusinessCardDto[];
  initialCursor: string | null;
  query: string;
}) {
  const [items, setItems] = useState<BusinessCardDto[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  async function more() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const sep = query ? `${query}&` : '';
      const res = await fetch(`/api/proxy/search?${sep}cursor=${encodeURIComponent(cursor)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as SearchResponse;
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
      {cursor && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={more} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  );
}
