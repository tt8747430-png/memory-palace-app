import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardSkeleton } from '../CardSkeleton';

vi.mock('@memory-palace/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  Skeleton: ({ className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('CardSkeleton', () => {
  it('renders 3 cards by default', () => {
    render(<CardSkeleton />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });

  it('renders the requested count', () => {
    render(<CardSkeleton count={5} />);
    expect(screen.getAllByRole('status')).toHaveLength(5);
  });

  it('renders 3 skeleton lines per card', () => {
    render(<CardSkeleton count={1} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('labels each card for screen readers', () => {
    render(<CardSkeleton count={2} />);
    expect(screen.getAllByRole('status', { name: 'Loading' })).toHaveLength(2);
  });

  it('marks inner skeletons as aria-hidden', () => {
    render(<CardSkeleton count={1} />);
    for (const el of screen.getAllByTestId('skeleton')) {
      expect(el).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('passes className to each card container', () => {
    render(<CardSkeleton count={2} className="extra" />);
    for (const el of screen.getAllByRole('status')) {
      expect(el.className).toMatch(/extra/);
    }
  });
});
