'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, Separator, cn } from '@memory-palace/ui';
import { signOut } from '@/shared/lib/signOut';
import { Avatar } from '@/shared/components/Avatar';

interface ProfileMenuProps {
  displayName: string;
  email?: string | null;
  avatarUrl: string | null;
}

function MenuRow({
  href,
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) {
  const className = cn(
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    variant === 'danger'
      ? 'text-destructive hover:bg-destructive/10'
      : 'text-foreground hover:bg-muted',
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

export function ProfileMenu({ displayName, email, avatarUrl }: ProfileMenuProps) {
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar displayName={displayName} avatarUrl={avatarUrl} size="sm" />
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-none">
            {displayName}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" sideOffset={8} className="w-64">
        {/* Identity header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar displayName={displayName} avatarUrl={avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">{email}</p>
            ) : null}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-1.5">
          <MenuRow href="/settings" icon={Settings} label="Profile settings" />
        </div>

        <Separator />

        <div className="p-1.5">
          <MenuRow
            icon={LogOut}
            label={pending ? 'Signing out…' : 'Sign out'}
            onClick={handleSignOut}
            variant="danger"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
