import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, type = 'button', children, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
        'bg-zinc-900 text-zinc-50 transition-colors hover:bg-zinc-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
        'disabled:pointer-events-none disabled:opacity-50',
        'dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
