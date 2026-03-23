import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardShell } from '../components/DashboardShell';

// Mock next/navigation (used by Sidebar, BottomNav)
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock @memory-palace/ui Sheet components (Radix Dialog needs a real DOM portal)
vi.mock('@memory-palace/ui', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet">{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SheetDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
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
    expect(screen.getByText('Memory Palace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('renders the notifications button', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const notifButton = screen.getByRole('button', { name: /notifications/i });
    expect(notifButton).toBeInTheDocument();
    expect(notifButton).toHaveAttribute('type', 'button');
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

  it('main content has safe-area bottom padding on mobile', () => {
    render(<DashboardShell>Content</DashboardShell>);
    const main = screen.getByRole('main');
    expect(main.className).toMatch(/pb-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\]/);
    expect(main.className).toMatch(/md:pb-0/);
  });
});
