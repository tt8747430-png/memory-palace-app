import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../components/LoginForm';
import type { AuthFormState } from '../actions/types';

const mockSignIn = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();

vi.mock('../actions/signIn', () => ({
  signIn: (prev: AuthFormState, formData: FormData) => mockSignIn(prev, formData),
}));

vi.mock('@memory-palace/ui', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders email and password inputs and the submit button', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the signup page', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });

  it('forwards typed credentials to the signIn action via FormData', async () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    const [, formData] = mockSignIn.mock.calls[0]!;
    expect(formData.get('email')).toBe('test@example.com');
    expect(formData.get('password')).toBe('password123');
  });

  it('displays the error message returned by the action', async () => {
    mockSignIn.mockResolvedValue({ status: 'error', message: 'Invalid login credentials' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
  });

  it('disables the submit button while the action is pending', async () => {
    let resolveAction: (value: AuthFormState) => void = () => {};
    mockSignIn.mockImplementation(
      () => new Promise<AuthFormState>((resolve) => (resolveAction = resolve)),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
    await act(async () => {
      resolveAction({ status: 'idle' });
    });
  });
});
