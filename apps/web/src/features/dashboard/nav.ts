import { Home, Building2, Settings, Brain, Gamepad2, type LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Optional pill badge shown next to the label (e.g. "New"). */
  badge?: string;
};

export type NavGroup = {
  /** Optional section heading shown in expanded sidebar mode. */
  title?: string;
  items: readonly NavItem[];
};

/**
 * Primary destinations shown in the mobile bottom tab bar.
 * Always exactly 4 items — the center slot of the bar is occupied
 * by the raised FAB and is not a navigation tab.
 */
export const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/palaces', icon: Building2, label: 'Palaces' },
  { href: '/practice', icon: Brain, label: 'Practice' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

/**
 * Desktop sidebar — grouped by purpose so collapsed (icon-rail) mode
 * still has visual separators and expanded mode reads like a hierarchy.
 */
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

/** Pinned footer section of the desktop sidebar. */
export const sidebarFooterItems: readonly NavItem[] = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
