import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkipToContent } from '../SkipToContent';

describe('SkipToContent', () => {
  it('renders an anchor with href="#main-content"', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('is visually hidden by default (sr-only class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link.className).toMatch(/sr-only/);
  });

  it('becomes visible on focus (focus:not-sr-only class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });

    expect(link.className).toMatch(/focus:not-sr-only/);
  });
});
