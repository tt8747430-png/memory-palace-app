import { Home, Building2, Settings, type LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Optional pill badge shown next to the label (e.g. "New"). */
  badge?: string;
};

/** Primary destinations shown in the bottom tab bar on mobile. */
export const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

/** Upper section of the desktop sidebar. */
export const sidebarPrimaryItems: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
];

/** Pinned footer section of the desktop sidebar. */
export const sidebarFooterItems: readonly NavItem[] = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
