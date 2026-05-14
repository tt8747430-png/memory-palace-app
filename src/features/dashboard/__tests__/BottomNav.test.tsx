import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav } from '@/features/dashboard';
import { navItems } from '../nav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe('BottomNav', () => {
  it('renders one link per nav item', () => {
    render(<BottomNav />);
    expect(screen.getAllByRole('link')).toHaveLength(navItems.length);
  });

  it('renders Home', () => {
    render(<BottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('aria-current', 'page');
  });

  it('applies text-primary class to the active tab', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i }).className).toMatch(/text-primary/);
  });

  it('each tab has 48px minimum touch targets', () => {
    render(<BottomNav />);
    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toMatch(/min-w-touch/);
      expect(link.className).toMatch(/min-h-touch/);
    }
  });

  it('links to the routes declared in nav config', () => {
    render(<BottomNav />);
    for (const item of navItems) {
      expect(screen.getByRole('link', { name: new RegExp(item.label, 'i') })).toHaveAttribute(
        'href',
        item.href,
      );
    }
  });

  it('renders a center FAB button with a context-aware label', () => {
    render(<BottomNav />);

    expect(screen.getByRole('button', { name: /new palace/i })).toBeInTheDocument();
  });
});
