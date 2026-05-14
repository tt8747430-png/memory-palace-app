import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '@/features/auth';
import type { AuthFormState } from '../actions/types';

const mockSignIn = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();

vi.mock('../actions/signIn', () => ({
  signIn: (prev: AuthFormState, formData: FormData) => mockSignIn(prev, formData),
}));

describe('Auth forms (real UI primitives)', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('LoginForm fields are accessible via label text', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('LoginForm submit button renders the "Sign In" label', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: 'Sign In' });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('Sign In');
  });

  it('LoginForm submit button reaches the action when clicked', async () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });
});
