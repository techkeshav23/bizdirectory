import {
  Bookmark,
  Store,
  ShieldCheck,
  ScrollText,
  FolderTree,
  MapPin,
  Users,
  MessageSquare,
  CreditCard,
  Megaphone,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react';

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
    label: 'My Business',
    items: [
      { name: 'Overview', href: '/dashboard/business', icon: LayoutDashboard, role: 'owner' },
      { name: 'My Listings', href: '/manage', icon: Store, role: 'owner', exact: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Saved', href: '/dashboard', icon: Bookmark, role: 'all', exact: true },
      { name: 'Settings', href: '/settings', icon: Settings, role: 'all' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Businesses', href: '/admin', icon: ShieldCheck, role: 'admin', exact: true },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree, role: 'admin' },
      { name: 'Locations', href: '/admin/locations', icon: MapPin, role: 'admin' },
      { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, role: 'admin' },
      { name: 'Users', href: '/admin/users', icon: Users, role: 'admin' },
      { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, role: 'admin' },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { name: 'Plans', href: '/admin/plans', icon: CreditCard, role: 'admin' },
      { name: 'Promotions', href: '/admin/promotions', icon: Megaphone, role: 'admin' },
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
