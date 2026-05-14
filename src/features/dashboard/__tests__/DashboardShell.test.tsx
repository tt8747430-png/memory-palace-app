import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardShell } from '@/features/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

vi.mock('@/shared/lib/signOut', () => ({
  signOut: vi.fn(),
}));

describe('DashboardShell', () => {
  it('renders children inside main content area', () => {
    render(
      <DashboardShell>
        <div data-testid="child-content">Hello Dashboard</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello Dashboard')).toBeInTheDocument();
  });

  it('renders the desktop sidebar inside an aside element', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const aside = screen.getByRole('complementary', { name: /main navigation/i });
    expect(aside).toBeInTheDocument();
  });

  it('renders the mobile bottom navigation', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const bottomNav = screen.getByRole('navigation', { name: /bottom navigation/i });
    expect(bottomNav).toBeInTheDocument();
  });

  it('renders the mobile top bar with title and hamburger menu', () => {
    render(<DashboardShell>Content</DashboardShell>);
    expect(screen.getByRole('heading', { level: 1, name: 'Memory Palace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('does not render a dead notifications button (dead UI removed)', () => {
    render(<DashboardShell>Content</DashboardShell>);
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('sidebar aside has hidden class for mobile-first (shown via md: breakpoint)', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const aside = screen.getByRole('complementary', { name: /main navigation/i });
    expect(aside.className).toMatch(/hidden/);
    expect(aside.className).toMatch(/md:flex/);
  });

  it('bottom nav has md:hidden class (hidden on desktop)', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const bottomNav = screen.getByRole('navigation', { name: /bottom navigation/i });
    expect(bottomNav.className).toMatch(/md:hidden/);
  });

  it('main content reserves space for the fixed mobile top bar', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const main = screen.getByRole('main');
    expect(main.className).toMatch(
      /pt-\[calc\(env\(safe-area-inset-top\)\+var\(--height-top-bar\)\)]/,
    );
    expect(main.className).toMatch(/md:pt-0/);
  });
});
