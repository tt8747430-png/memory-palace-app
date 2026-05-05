import { Home, Building2, Settings, type LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

// Single source of truth for navigation. Add routes here only when the page
// they point to actually exists — Sidebar and BottomNav both read from this
// list, so a 404 link is a 404 link in two places.
export const navItems: readonly NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
