'use client';

import { useEffect, useState, type ElementType } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/ui';

export interface MobileAction {
  label: string;
  Icon: ElementType;
  onClick: () => void;
}

interface Props {
  actions: ReadonlyArray<MobileAction>;
  className?: string;
}

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
