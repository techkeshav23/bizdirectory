'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search as SearchIcon } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { visibleSections } from './navigation';

interface Suggestion {
  name: string;
  slug: string;
  location: { name: string } | null;
}

export function CommandPalette({ isAdmin, isOwner }: { isAdmin: boolean; isOwner: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const sections = visibleSections(isAdmin, isOwner);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener('keydown', onKey);
    window.addEventListener('open-command', onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command', onOpen);
    };
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/search/suggest?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d) ? d : []))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {sections.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem key={item.href} value={item.name} onSelect={() => go(item.href)}>
                <item.icon /> {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandGroup heading="Quick actions">
          <CommandItem value="add listing" onSelect={() => go('/register')}>
            <Plus /> Add a business listing
          </CommandItem>
          <CommandItem value="search businesses" onSelect={() => go('/search')}>
            <SearchIcon /> Search the directory
          </CommandItem>
        </CommandGroup>
        {results.length > 0 && (
          <CommandGroup heading="Businesses">
            {results.map((r) => (
              <CommandItem
                key={r.slug}
                value={`biz-${r.slug}`}
                onSelect={() => go(`/business/${r.slug}`)}
              >
                <SearchIcon /> {r.name}
                {r.location ? <span className="text-muted-foreground">· {r.location.name}</span> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
