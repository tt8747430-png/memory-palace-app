import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav } from '../components/BottomNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('BottomNav', () => {
  it('renders 5 tabs', () => {
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('renders the correct tab labels', () => {
    render(<BottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Palaces')).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive tabs with aria-current', () => {
    render(<BottomNav />);
    const gamesLink = screen.getByRole('link', { name: /games/i });
    expect(gamesLink).not.toHaveAttribute('aria-current');
  });

  it('applies text-primary class to the active tab', () => {
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink.className).toMatch(/text-primary/);
  });

  it('applies text-muted-foreground class to inactive tabs', () => {
    render(<BottomNav />);
    const gamesLink = screen.getByRole('link', { name: /games/i });
    expect(gamesLink.className).toMatch(/text-muted-foreground/);
  });

  it('each tab has 48px minimum touch targets', () => {
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.className).toMatch(/min-w-touch/);
      expect(link.className).toMatch(/min-h-touch/);
    }
  });

  it('links to the correct routes', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /daily/i })).toHaveAttribute('href', '/daily');
    expect(screen.getByRole('link', { name: /games/i })).toHaveAttribute('href', '/games');
    expect(screen.getByRole('link', { name: /progress/i })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: /palaces/i })).toHaveAttribute('href', '/palace');
  });
});
