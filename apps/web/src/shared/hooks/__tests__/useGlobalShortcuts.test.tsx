import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGlobalShortcuts } from '@/shared/hooks/useGlobalShortcuts';
import { CommandPaletteProvider } from '@/shared/components/CommandPaletteContext';
import { ShortcutsOverlayProvider } from '@/shared/components/ShortcutsOverlayContext';
import type { ReactNode } from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => '/'),
}));

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: mockSetTheme }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ShortcutsOverlayProvider>
      <CommandPaletteProvider>{children}</CommandPaletteProvider>
    </ShortcutsOverlayProvider>
  );
}

function keydown(key: string, extra?: Partial<KeyboardEventInit>) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('mounts without errors', () => {
    expect(() => renderHook(() => useGlobalShortcuts(), { wrapper })).not.toThrow();
  });

  it('navigates to / on g → h', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('g');
    keydown('h');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to /palaces on g → p', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('g');
    keydown('p');
    expect(mockPush).toHaveBeenCalledWith('/palaces');
  });

  it('navigates to /settings on g → s', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('g');
    keydown('s');
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('navigates to /palaces?action=create on c → p', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('c');
    keydown('p');
    expect(mockPush).toHaveBeenCalledWith('/palaces?action=create');
  });

  it('toggles theme on t → d (light → dark)', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('t');
    keydown('d');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('does not navigate when sequence is broken by a wrong second key', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    keydown('g');
    keydown('z'); // not a valid second key
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores shortcuts when focus is in an input', () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    keydown('g');
    keydown('h');
    expect(mockPush).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useGlobalShortcuts(), { wrapper });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
