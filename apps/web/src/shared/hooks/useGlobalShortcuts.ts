'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCommandPalette } from '../components/CommandPaletteContext';
import { useShortcutsOverlay } from '../components/ShortcutsOverlayContext';

/**
 * Registers all application-wide keyboard shortcuts.
 *
 * Sequential shortcuts (e.g. "g then h") use a prefix-key state-machine:
 *   1. A "prefix" key (g, c, t) arms a 1-second window.
 *   2. The next keystroke within that window fires the mapped action.
 *
 * Cmd/Ctrl+K is handled separately because it must work even inside inputs.
 *
 * This hook must be rendered inside both CommandPaletteProvider and
 * ShortcutsOverlayProvider.
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { openPalette } = useCommandPalette();
  const { openOverlay } = useShortcutsOverlay();

  // Keep a stable ref to the prefix-key timer so cleanup can always reach it,
  // even if the effect is torn down mid-sequence.
  const prefixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /** Key pressed during the prefix window, or null if no window is active. */
    let prefixKey: string | null = null;

    function clearPrefix() {
      if (prefixTimerRef.current !== null) clearTimeout(prefixTimerRef.current);
      prefixTimerRef.current = null;
      prefixKey = null;
    }

    function armPrefix(key: string) {
      clearPrefix();
      prefixKey = key;
      prefixTimerRef.current = setTimeout(clearPrefix, 1000);
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
      // ── Cmd/Ctrl+K: open palette (works in all contexts) ────────────────
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
        clearPrefix();
        return;
      }

      // ── All other shortcuts ignore input elements ────────────────────────
      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // ── Sequential: resolve the pending prefix ────────────────────────────
      if (prefixKey !== null) {
        const combo = `${prefixKey}${key}`;
        clearPrefix();

        switch (combo) {
          case 'gh':
            router.push('/');
            break;
          case 'gp':
            router.push('/palaces');
            break;
          case 'gs':
            router.push('/settings');
            break;
          case 'cp':
            router.push('/palaces?action=create');
            break;
          case 'td':
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
            break;
          default:
            break;
        }
        return;
      }

      // ── Single-key shortcuts ─────────────────────────────────────────────
      if (key === '?') {
        e.preventDefault();
        openOverlay();
        return;
      }

      // ── Arm a prefix window ───────────────────────────────────────────────
      if (key === 'g' || key === 'c' || key === 't') {
        armPrefix(key);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearPrefix();
    };
  }, [router, setTheme, resolvedTheme, openPalette, openOverlay]);
}
