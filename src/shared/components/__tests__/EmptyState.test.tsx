import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title as an h2 by default', () => {
    render(<EmptyState title="Build your first palace" />);
    const heading = screen.getByRole('heading', { name: /build your first palace/i, level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('respects the headingLevel prop for nested contexts', () => {
    render(<EmptyState title="No rooms yet" headingLevel={3} />);
    expect(screen.getByRole('heading', { name: /no rooms yet/i, level: 3 })).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="Empty" description="Nothing to show yet." />);
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
  });

  it('omits the description element when none is provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText(/^.+$/, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders an arbitrary action node', () => {
    render(
      <EmptyState
        title="No palaces"
        action={
          <a href="/palace/new" data-testid="cta">
            Create palace
          </a>
        }
      />,
    );
    expect(screen.getByTestId('cta')).toHaveAttribute('href', '/palace/new');
  });

  it('marks the icon decorative for screen readers', () => {
    render(<EmptyState title="No results" icon={<span data-testid="icon">🔍</span>} />);
    const iconWrapper = screen.getByTestId('icon').parentElement;
    expect(iconWrapper).toHaveAttribute('aria-hidden');
  });

  it('does not expose role="status" by default (avoids spurious announcements on first paint)', () => {
    render(<EmptyState title="Loaded but empty" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('exposes role="status" only when announce is true (post-refetch live update)', () => {
    render(<EmptyState title="Loaded but empty" announce />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('merges the consumer className with the base layout classes', () => {
    render(<EmptyState title="x" className="bg-card" announce />);
    const container = screen.getByRole('status');
    expect(container.className).toMatch(/bg-card/);
    expect(container.className).toMatch(/flex/);
  });
});
