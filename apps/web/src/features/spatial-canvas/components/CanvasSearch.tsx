'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';

/**
 * Live canvas search overlay — toggled by Cmd/Ctrl+F or the `/` key.
 *
 * While the query is non-empty, RoomCanvas dims nodes whose title and content
 * don't match. Clearing the input (or pressing Escape) exits search mode.
 *
 * Desktop-only (`hidden md:flex`) — positioned top-right of the canvas.
 */
export function CanvasSearch() {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useCanvasStore((s) => s.canvasSearchQuery);
  const setQuery = useCanvasStore((s) => s.setCanvasSearchQuery);

  // useCallback so `close` is stable and can be listed as a dep below.
  const close = useCallback(() => {
    setVisible(false);
    setQuery('');
  }, [setQuery]);

  // Toggle with Cmd/Ctrl+F or `/` (outside inputs).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      if (e.key === '/' && !inInput) {
        e.preventDefault();
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      if (e.key === 'Escape' && visible) {
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [visible, close]);

  if (!visible) return null;

  return (
    <div
      role="search"
      aria-label="Search canvas nodes"
      className={cn(
        'absolute right-4 top-4 z-20 hidden md:flex',
        'items-center gap-1 rounded-lg border bg-card/95 px-2 py-1 shadow-md backdrop-blur-sm',
        'w-56',
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter nodes…"
        aria-label="Filter canvas nodes by title or content"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery('')}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="ml-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
