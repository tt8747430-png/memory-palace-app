import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
    'bg-zinc-900 text-zinc-50 transition-colors hover:bg-zinc-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
    'disabled:pointer-events-none disabled:opacity-50',
    'dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={classes} type={type} {...props} />;
}

