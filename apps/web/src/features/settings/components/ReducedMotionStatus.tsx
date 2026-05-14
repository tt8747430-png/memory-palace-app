'use client';

import { useSyncExternalStore } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@memory-palace/ui';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function ReducedMotionStatus() {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const Icon = reduced ? CheckCircle2 : Circle;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3',
        reduced && 'border-primary/30 bg-primary/5',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          reduced ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {reduced ? 'Reduced motion is on' : 'Full motion is on'}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Memory Palace follows your system{' '}
          <span className="font-mono">prefers-reduced-motion</span> setting. Change it in your OS
          accessibility preferences to update this.
        </p>
      </div>
    </div>
  );
}
