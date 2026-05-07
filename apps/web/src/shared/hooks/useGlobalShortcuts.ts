'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCommandPalette } from '../components/CommandPaletteContext';
import { useShortcutsOverlay } from '../components/ShortcutsOverlayContext';
import { useAppDialog } from '../components/AppDialogContext';
import { CANVAS_EVENTS } from '../lib/canvasEvents';
import { findChordAction } from '../lib/commandActions';

/**
 * Duration of the prefix-key window in ms.  1 second is long enough for
 * intentional two-key chords while short enough to avoid stale prefix arms.
 */
const PREFIX_TIMEOUT_MS = 1_000;

const PREFIX_KEYS = new Set(['g', 'c', 't']);

/**
 * Registers all application-wide keyboard shortcuts.
 *
 * Sequential shortcuts (e.g. "g then h") use a prefix-key state-machine:
 *   1. A "prefix" key (g, c, t) arms a 1-second window.
 *   2. The next keystroke within that window resolves to a chord action.
 *
 * Cmd/Ctrl+K is handled separately because it must work even inside inputs.
 *
 * This hook must be rendered inside both CommandPaletteProvider and
 * ShortcutsOverlayProvider.
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { openPalette } = useCommandPalette();
  const { openOverlay } = useShortcutsOverlay();
  const { open: openDialog } = useAppDialog();

  const prefixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let prefixKey: string | null = null;

    function clearPrefix() {
      if (prefixTimerRef.current !== null) clearTimeout(prefixTimerRef.current);
      prefixTimerRef.current = null;
      prefixKey = null;
    }

    function armPrefix(key: string) {
      clearPrefix();
      prefixKey = key;
      prefixTimerRef.current = setTimeout(clearPrefix, PREFIX_TIMEOUT_MS);
    }

    function isInputFocused(): boolean {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
        clearPrefix();
        return;
      }

      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (prefixKey !== null) {
        const combo = `${prefixKey}${key}`;
        clearPrefix();
        const action = findChordAction(combo, pathname);
        action?.run({
          router,
          pathname,
          setTheme,
          resolvedTheme,
          openOverlay,
          openDialog,
          // Sign-out has no chord, so this branch is unreachable from the hook.
          signOut: () => {},
          dispatchCanvas: (name) => window.dispatchEvent(new CustomEvent(name)),
        });
        return;
      }

      if (key === '?') {
        e.preventDefault();
        openOverlay();
        return;
      }

      if (PREFIX_KEYS.has(key)) {
        armPrefix(key);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearPrefix();
    };
  }, [router, pathname, setTheme, resolvedTheme, openPalette, openOverlay, openDialog]);
}

// Re-export for tests that previously imported via this path.
export { CANVAS_EVENTS };
