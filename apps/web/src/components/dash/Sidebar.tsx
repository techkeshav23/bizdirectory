'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { visibleSections } from './navigation';
import { UserMenu } from './UserMenu';

interface SidebarUser {
  name: string;
  email: string | null;
  phone: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export function SidebarNavList({
  isAdmin,
  isOwner,
  collapsed,
  onNavigate,
}: {
  isAdmin: boolean;
  isOwner: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = visibleSections(isAdmin, isOwner);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {sections.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-background-2/50 transition-[width] duration-200 md:flex',
        ready && collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-foreground">
            Biz<span className="text-primary">Directory</span>
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label="Toggle sidebar"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNavList isAdmin={user.isAdmin} isOwner={user.isOwner} collapsed={collapsed} />
      </div>

      <div className="border-t border-border p-2">
        <UserMenu name={user.name} email={user.email} phone={user.phone} collapsed={collapsed} />
      </div>
    </aside>
  );
}
