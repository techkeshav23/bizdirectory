import {
  Bookmark,
  Store,
  BarChart3,
  ShieldCheck,
  FolderTree,
  MapPin,
  Users,
  Star,
  CreditCard,
  Megaphone,
  Globe,
  ScrollText,
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
    label: 'Overview',
    items: [
      { name: 'Saved', href: '/dashboard', icon: Bookmark, role: 'all', exact: true },
      { name: 'Analytics', href: '/dashboard/business', icon: BarChart3, role: 'owner' },
    ],
  },
  {
    label: 'My Business',
    items: [{ name: 'My Listings', href: '/manage', icon: Store, role: 'owner', exact: true }],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Moderation', href: '/admin', icon: ShieldCheck, role: 'admin', exact: true },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree, role: 'admin' },
      { name: 'Locations', href: '/admin/locations', icon: MapPin, role: 'admin' },
      { name: 'Users', href: '/admin/users', icon: Users, role: 'admin' },
      { name: 'Reviews', href: '/admin/reviews', icon: Star, role: 'admin' },
      { name: 'Plans', href: '/admin/plans', icon: CreditCard, role: 'admin' },
      { name: 'Promotions', href: '/admin/promotions', icon: Megaphone, role: 'admin' },
      { name: 'SEO', href: '/admin/seo', icon: Globe, role: 'admin' },
      { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, role: 'admin' },
    ],
  },
  {
    label: 'Account',
    items: [{ name: 'Settings', href: '/settings', icon: Settings, role: 'all' }],
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
