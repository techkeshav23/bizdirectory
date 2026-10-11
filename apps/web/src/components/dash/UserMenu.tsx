'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';
import { clientApi } from '@/lib/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  name: string;
  email: string | null;
  phone: string;
  collapsed?: boolean;
}

export function UserMenu({ name, email, phone, collapsed }: Props) {
  const router = useRouter();
  const initials = (name || phone).slice(0, 2).toUpperCase();

  async function logout() {
    await clientApi('POST', '/auth/logout').catch(() => {});
    router.push('/');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{name || 'Account'}</div>
              <div className="truncate text-xs text-muted-foreground">{email ?? phone}</div>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel>{name || 'Signed in'}</DropdownMenuLabel>
        <div className="px-2 pb-2 text-xs text-muted-foreground">{email ?? phone}</div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <UserIcon /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
