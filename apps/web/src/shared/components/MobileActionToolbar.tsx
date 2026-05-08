'use client';

import { useEffect, useState, type ElementType } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@memory-palace/ui';

export interface MobileAction {
  label: string;
  Icon: ElementType;
  onClick: () => void;
}

interface Props {
  actions: ReadonlyArray<MobileAction>;
  className?: string;
}

/**
 * Generic md:hidden FAB for list-page primary actions. Mirrors CanvasFab's UX
 * (radial expand, Esc to close, safe-area-inset aware) without depending on
 * canvas state, so the same primitive can sit on /palaces, /palaces/[id], and
 * any future list page.
 *
 * Mounted by client wrappers — never imports feature-specific hooks itself.
 */
export function MobileActionToolbar({ actions, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Single-action shortcut: tap fires immediately, no menu.
  if (actions.length === 1) {
    const only = actions[0]!;
    return (
      <div
        className={cn(
          'fixed right-4 z-40 md:hidden',
          'bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]',
          className,
        )}
      >
        <button
          type="button"
          onClick={only.onClick}
          aria-label={only.label}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <only.Icon className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed right-4 z-40 flex flex-col items-end gap-2 md:hidden',
        'bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]',
        className,
      )}
    >
      {open
        ? actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className="flex h-touch min-w-[10rem] items-center gap-3 rounded-full border bg-card px-4 shadow-lg"
            >
              <a.Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          ))
        : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close actions' : 'Open actions'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
