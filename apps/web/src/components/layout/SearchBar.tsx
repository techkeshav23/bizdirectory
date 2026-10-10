'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

  return (
    <form
      onSubmit={submit}
      className={`flex w-full items-center overflow-hidden rounded-full border border-line bg-white transition-shadow focus-within:border-brand-400 ${
        big ? 'shadow-[var(--shadow-lift)] focus-within:shadow-[var(--shadow-lift)]' : 'shadow-sm'
      }`}
    >
      <span className={`pl-5 text-ink-soft ${big ? 'text-lg' : 'text-base'}`} aria-hidden>
        ⌕
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="What are you looking for?"
        className={`min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted ${big ? 'h-16 text-base' : 'h-12 text-sm'}`}
      />
      <span className="h-6 w-px bg-line" aria-hidden />
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
        className={`w-24 bg-transparent px-4 outline-none placeholder:text-muted ${big ? 'h-16 text-base' : 'h-12 text-sm'}`}
      />
      <button
        type="submit"
        className={`m-1.5 rounded-full bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600 ${big ? 'h-[3.25rem] text-base' : 'h-9 text-sm'}`}
      >
        Search
      </button>
    </form>
  );
}
