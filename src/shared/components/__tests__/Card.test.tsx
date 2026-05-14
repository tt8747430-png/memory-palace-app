import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/ui';

describe('Card', () => {
  it('renders a div container with card styling classes', () => {
    render(<Card data-testid="card">content</Card>);
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card.className).toMatch(/rounded-lg/);
    expect(card.className).toMatch(/border/);
    expect(card.className).toMatch(/bg-card/);
  });

  it('forwards className to Card', () => {
    render(
      <Card data-testid="card" className="custom">
        x
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('custom');
  });

  it('CardHeader renders children inside a div', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const el = screen.getByTestId('header');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toMatch(/p-6/);
  });

  it('CardTitle renders an h3', () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3, name: 'My Title' })).toBeInTheDocument();
  });

  it('CardDescription renders a paragraph', () => {
    render(<CardDescription>Some description</CardDescription>);
    const el = screen.getByText('Some description');
    expect(el.tagName).toBe('P');
    expect(el.className).toMatch(/text-muted-foreground/);
  });

  it('CardContent renders children with correct padding', () => {
    render(<CardContent data-testid="content">Body</CardContent>);
    const el = screen.getByTestId('content');
    expect(el.className).toMatch(/p-6/);
    expect(el.className).toMatch(/pt-0/);
  });

  it('CardFooter renders with flex layout', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const el = screen.getByTestId('footer');
    expect(el.className).toMatch(/flex/);
    expect(el.className).toMatch(/items-center/);
  });

  it('composes all sub-components correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Palace Grid</CardTitle>
          <CardDescription>Manage your palaces</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Palace Grid' })).toBeInTheDocument();
    expect(screen.getByText('Manage your palaces')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
