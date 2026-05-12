'use client';

import { useState } from 'react';
import { cn } from '@memory-palace/ui';

const SIZE_CLASSES = {
  sm: 'h-7 w-7 text-[0.625rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-16 w-16 text-lg',
} as const;

interface AvatarProps {
  displayName: string;
  avatarUrl: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function Avatar({ displayName, avatarUrl, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(displayName);

  if (avatarUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${displayName} avatar`}
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-border',
          sizeClass,
          className,
        )}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-1 ring-border',
        sizeClass,
        className,
      )}
    >
      {initials || '?'}
    </div>
  );
}
