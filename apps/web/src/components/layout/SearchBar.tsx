'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export function SearchBar({ big = false }: { big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (city.trim()) params.set('city', city.trim());
    router.push(`/search?${params.toString()}`);
  }

  const h = big ? 'h-14' : 'h-11';

  return (
    <form
      onSubmit={submit}
      className={`flex w-full items-center overflow-hidden rounded-[var(--radius)] border border-input bg-card transition-colors focus-within:border-primary ${
        big ? 'shadow-[var(--shadow-card)]' : ''
      }`}
    >
      <div className={`flex min-w-0 flex-[2] items-center gap-2 pl-3.5 ${h}`}>
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for?"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${big ? 'text-base' : 'text-sm'}`}
        />
      </div>
      <span className="h-6 w-px bg-border" aria-hidden />
      <div className={`flex min-w-0 flex-1 items-center gap-2 pl-3 ${h}`}>
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${big ? 'text-base' : 'text-sm'}`}
        />
      </div>
      <button
        type="submit"
        className={`m-1 flex shrink-0 items-center gap-1.5 rounded-[calc(var(--radius)-2px)] bg-primary px-5 font-medium text-primary-foreground transition-colors hover:brightness-110 ${big ? 'h-12 text-base' : 'h-9 text-sm'}`}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
