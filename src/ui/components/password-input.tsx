'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/ui';
import { cn } from '@/ui';

export type PasswordInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'> & {
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  className,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  const Icon = revealed ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input type={revealed ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? hideLabel : showLabel}
        {...(props.id ? { 'aria-controls': props.id } : {})}
        tabIndex={-1}
        disabled={props.disabled}
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-center',
          'h-full w-12 rounded-r-md',
          'text-current opacity-60 hover:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
          'transition-opacity',
          'disabled:opacity-40',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
