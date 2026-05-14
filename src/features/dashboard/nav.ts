import { Home, Building2, Settings, Layers, type LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
};

export type NavGroup = {
  title?: string;
  items: readonly NavItem[];
};

export const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
  { href: '/practice', icon: Layers, label: 'Practice' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export const sidebarGroups: readonly NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/dashboard', icon: Home, label: 'Home' },
      { href: '/palaces', icon: Building2, label: 'Palaces' },
    ],
  },
  {
    title: 'Learn',
    items: [{ href: '/practice', icon: Layers, label: 'Practice' }],
  },
];

export const sidebarFooterItems: readonly NavItem[] = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
