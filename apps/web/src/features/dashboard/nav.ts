import { Home, Building2, Settings, type LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
