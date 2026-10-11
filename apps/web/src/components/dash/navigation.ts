import { Bookmark, Store, ShieldCheck, ScrollText, type LucideIcon } from 'lucide-react';

export type NavRole = 'all' | 'owner' | 'admin';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  role: NavRole;
  exact?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [{ name: 'Saved', href: '/dashboard', icon: Bookmark, role: 'all', exact: true }],
  },
  {
    label: 'My Business',
    items: [{ name: 'My Listings', href: '/manage', icon: Store, role: 'owner', exact: true }],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Moderation', href: '/admin', icon: ShieldCheck, role: 'admin', exact: true },
      { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, role: 'admin' },
    ],
  },
];

export function visibleSections(isAdmin: boolean, isOwner: boolean): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.role === 'admin') return isAdmin;
        if (item.role === 'owner') return isOwner;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
