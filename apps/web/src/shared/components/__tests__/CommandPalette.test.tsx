import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandPaletteProvider, useCommandPalette } from '../CommandPaletteContext';
import { ShortcutsOverlayProvider } from '../ShortcutsOverlayContext';
import { CommandPalette } from '../CommandPalette';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/shared/lib/signOut', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ShortcutsOverlayProvider>
      <CommandPaletteProvider>{children}</CommandPaletteProvider>
    </ShortcutsOverlayProvider>
  );
}

function OpenButton() {
  const { openPalette } = useCommandPalette();
  return <button onClick={openPalette}>Open</button>;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CommandPaletteContext', () => {
  it('throws when used outside provider', () => {
    const original = console.error;
    console.error = vi.fn();
    expect(() => render(<OpenButton />)).toThrow();
    console.error = original;
  });

  it('provides open/openPalette/closePalette', () => {
    render(
      <Wrapper>
        <OpenButton />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });
});

describe('CommandPalette', () => {
  beforeEach(() => {
    render(
      <Wrapper>
        <OpenButton />
        <CommandPalette />
      </Wrapper>,
    );
  });

  it('is closed by default', () => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when openPalette is called', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
  });

  it('renders navigation actions', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Go to Palaces')).toBeInTheDocument();
    expect(screen.getByText('Go to Settings')).toBeInTheDocument();
  });

  it('renders create actions', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Create New Palace')).toBeInTheDocument();
  });

  it('renders tools actions', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText(/dark mode|light mode/i)).toBeInTheDocument();
    expect(screen.getByText('Show Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('shows shortcut hints alongside actions', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('G H')).toBeInTheDocument();
    expect(screen.getByText('T D')).toBeInTheDocument();
  });
});
