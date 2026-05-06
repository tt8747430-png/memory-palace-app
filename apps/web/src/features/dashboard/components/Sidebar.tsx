'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { SearchDialog } from '@/shared/components/SearchDialog';
import { navItems, isNavItemActive } from '../nav';
import { ModeToggle } from './ModeToggle';
import { ProfileMenu } from './ProfileMenu';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
  email?: string | null;
}

interface SidebarProps {
  userProfile?: UserProfile | null;
  /** Injected search action — passed from the app layer to avoid boundary violations. */
  onSearch?: SearchDialogProps['onSearch'];
}

type SearchDialogProps = React.ComponentProps<typeof SearchDialog>;

export function Sidebar({ userProfile, onSearch }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-6 py-5 text-lg font-bold tracking-tight">🏛️ Memory Palace</div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-muted font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: search + profile menu + theme toggle */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-1">
          {onSearch && <SearchDialog onSearch={onSearch} />}
          {userProfile ? (
            <ProfileMenu
              displayName={userProfile.displayName}
              avatarUrl={userProfile.avatarUrl}
              email={userProfile.email}
            />
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
