'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Compass } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader, EmptyState, ErrorState, ListingGridSkeleton } from '@/components/shared';

interface SavedBiz {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ratingAvg: string | number;
}

export default function CustomerDashboard() {
  const [saved, setSaved] = useState<SavedBiz[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await clientApi<{ saved: SavedBiz[] }>('GET', '/dashboard/customer');
      setSaved(d.saved);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-rise">
      <PageHeader icon={Bookmark} title="Saved businesses" description="Your bookmarked listings." />

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : saved === null ? (
        <ListingGridSkeleton count={4} />
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing saved yet"
          description="Explore the directory and bookmark businesses to find them here."
          action={<Button href="/">Explore businesses</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {saved.map((b) => (
            <Link key={b.id} href={`/business/${b.slug}`}>
              <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <Avatar className="size-14 rounded-xl">
                  {b.logoUrl && <AvatarImage src={b.logoUrl} alt={b.name} />}
                  <AvatarFallback className="rounded-xl text-lg">
                    {b.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">★ {Number(b.ratingAvg).toFixed(1)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
