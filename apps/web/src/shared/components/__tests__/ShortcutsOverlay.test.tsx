import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShortcutsOverlayProvider, useShortcutsOverlay } from '../ShortcutsOverlayContext';
import { ShortcutsOverlay } from '../ShortcutsOverlay';

// ── Helper ─────────────────────────────────────────────────────────────────────

function OpenButton() {
  const { openOverlay } = useShortcutsOverlay();
  return <button onClick={openOverlay}>Open shortcuts</button>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ShortcutsOverlayProvider>{children}</ShortcutsOverlayProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ShortcutsOverlay', () => {
  it('is closed by default', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when openOverlay is called', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open shortcuts' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the dialog title', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open shortcuts' }));
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('lists all shortcut sections', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open shortcuts' }));
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
  });

  it('renders shortcut key badges', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open shortcuts' }));
    // Cmd+K badge
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('renders all documented shortcuts', () => {
    render(
      <Wrapper>
        <OpenButton />
        <ShortcutsOverlay />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open shortcuts' }));
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Toggle dark / light mode')).toBeInTheDocument();
    expect(screen.getByText('Toggle snap-to-grid')).toBeInTheDocument();
  });
});

describe('ShortcutsOverlayContext', () => {
  it('throws when used outside provider', () => {
    const original = console.error;
    console.error = vi.fn();
    expect(() => render(<OpenButton />)).toThrow();
    console.error = original;
  });
});
