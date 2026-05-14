import { Home, Building2, Settings, Brain, Gamepad2, type LucideIcon } from 'lucide-react';

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
  { href: '/practice', icon: Brain, label: 'Practice' },
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
    items: [
      { href: '/practice', icon: Brain, label: 'Practice' },
      { href: '/games', icon: Gamepad2, label: 'Games' },
    ],
  },
];

export const sidebarFooterItems: readonly NavItem[] = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
