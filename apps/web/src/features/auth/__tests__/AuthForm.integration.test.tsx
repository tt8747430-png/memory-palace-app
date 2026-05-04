/**
 * Integration test for the auth forms — uses the REAL `@memory-palace/ui`
 * primitives. The other AuthForm tests mock `@memory-palace/ui` to avoid
 * Radix portal complexity, which means they don't notice when the real
 * Button or Input drops children. This file fills that gap.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';
import type { AuthFormState } from '../actions/types';

const mockSignIn = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();
const mockSignUp = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();

vi.mock('../actions/signIn', () => ({
  signIn: (prev: AuthFormState, formData: FormData) => mockSignIn(prev, formData),
}));
vi.mock('../actions/signUp', () => ({
  signUp: (prev: AuthFormState, formData: FormData) => mockSignUp(prev, formData),
}));

describe('Auth forms (real UI primitives)', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignUp.mockReset();
  });

  it('LoginForm submit button renders the "Sign In" label', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: 'Sign In' });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('Sign In');
  });

  it('SignupForm submit button renders the "Create Account" label', () => {
    mockSignUp.mockResolvedValue({ status: 'idle' });
    render(<SignupForm />);
    const button = screen.getByRole('button', { name: 'Create Account' });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('Create Account');
  });

  it('LoginForm Input components render with placeholder visible', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('LoginForm submit button reaches the action when clicked', async () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });
});
