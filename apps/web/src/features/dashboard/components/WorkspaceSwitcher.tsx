'use client';

import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@memory-palace/ui';

interface WorkspaceSwitcherProps {
  displayName?: string | null;
  email?: string | null;
  /** Optional click handler — left inert until multi-workspace lands. */
  onClick?: () => void;
}

/**
 * Sidebar header workspace identity (Figma 2026 "Sidebar_Tutorial" pattern).
 * Hash-avatar + display name + email + chevron. Currently inert — clicking
 * is a no-op until multi-workspace ships; the visual anchor exists so the
 * future popover lands without re-shuffling the header layout.
 */
export function WorkspaceSwitcher({ displayName, email, onClick }: WorkspaceSwitcherProps) {
  const safeName = displayName?.trim() || 'Memory Palace';
  const hash = deterministicHash(safeName + (email ?? ''));
  const initials = safeName.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors',
        'hover:bg-muted/60',
      )}
      aria-label={`Workspace: ${safeName}`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background font-mono text-[0.65rem] tracking-tighter"
      >
        {hash}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">{safeName}</span>
        {email ? (
          <span className="truncate text-[0.7rem] text-muted-foreground">{email}</span>
        ) : (
          <span className="truncate text-[0.7rem] text-muted-foreground">
            {initials} · workspace
          </span>
        )}
      </span>
      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
    </button>
  );
}

/** Tiny FNV-1a-ish 32-bit hash → 4-char base36. Deterministic, no crypto. */
function deterministicHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36).slice(0, 4).padStart(4, '0');
}
