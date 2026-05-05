import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '@memory-palace/ui';

describe('Label', () => {
  it('renders a <label> element', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email').tagName).toBe('LABEL');
  });

  it('associates with an input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" type="email" />
      </>,
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('forwards className to the label element', () => {
    render(<Label className="custom-class">Name</Label>);
    expect(screen.getByText('Name')).toHaveClass('custom-class');
  });

  it('carries base styling classes', () => {
    render(<Label>Base</Label>);
    const label = screen.getByText('Base');
    expect(label.className).toMatch(/text-sm/);
    expect(label.className).toMatch(/font-medium/);
  });

  it('forwards arbitrary HTML attributes', () => {
    render(<Label data-testid="my-label">Field</Label>);
    expect(screen.getByTestId('my-label')).toBeInTheDocument();
  });
});
