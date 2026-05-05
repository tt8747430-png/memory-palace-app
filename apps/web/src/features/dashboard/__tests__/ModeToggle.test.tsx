import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModeToggle } from '../components/ModeToggle';

const setTheme = vi.fn();
const useThemeMock = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => useThemeMock(),
}));

beforeEach(() => {
  setTheme.mockReset();
  useThemeMock.mockReset();
});

describe('ModeToggle', () => {
  it('shows the Sun icon and "switch to dark theme" label when theme is light', async () => {
    useThemeMock.mockReturnValue({ theme: 'light', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to dark theme/i });
    expect(button).toBeInTheDocument();
  });

  it('shows the Moon icon and "switch to system theme" label when theme is dark', async () => {
    useThemeMock.mockReturnValue({ theme: 'dark', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to system theme/i });
    expect(button).toBeInTheDocument();
  });

  it('shows the Monitor icon and "switch to light theme" label when theme is system', async () => {
    useThemeMock.mockReturnValue({ theme: 'system', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to light theme/i });
    expect(button).toBeInTheDocument();
  });

  it('cycles light → dark on click', async () => {
    useThemeMock.mockReturnValue({ theme: 'light', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to dark theme/i });
    await userEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles dark → system on click', async () => {
    useThemeMock.mockReturnValue({ theme: 'dark', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to system theme/i });
    await userEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('system');
  });

  it('cycles system → light on click', async () => {
    useThemeMock.mockReturnValue({ theme: 'system', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to light theme/i });
    await userEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('treats an unknown theme value as system', async () => {
    useThemeMock.mockReturnValue({ theme: 'sepia', setTheme });
    render(<ModeToggle />);
    const button = await screen.findByRole('button', { name: /switch to light theme/i });
    await userEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
