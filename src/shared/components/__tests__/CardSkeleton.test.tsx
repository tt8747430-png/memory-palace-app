import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardSkeleton } from '../CardSkeleton';
import { ComponentProps } from 'react';

vi.mock('@/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  Skeleton: ({ className, ...props }: ComponentProps<'div'>) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('CardSkeleton', () => {
  it('renders 3 card placeholders by default', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });

  it('renders the requested count', () => {
    const { container } = render(<CardSkeleton count={5} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(5);
  });

  it('renders 3 skeleton lines per card', () => {
    render(<CardSkeleton count={1} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('exposes a single labelled live region for the whole group', () => {
    render(<CardSkeleton count={2} />);
    expect(screen.getAllByRole('status', { name: 'Loading' })).toHaveLength(1);
  });

  it('passes className to each card container', () => {
    const { container } = render(<CardSkeleton count={2} className="extra" />);
    const cards = container.querySelectorAll('[aria-hidden="true"]');
    expect(cards).toHaveLength(2);
    cards.forEach((el) => expect(el.className).toMatch(/extra/));
  });
});
