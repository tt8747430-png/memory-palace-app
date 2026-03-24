import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from '../components/SignupForm';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignUp = vi.fn();
vi.mock('@/shared/lib/supabase-browser', () => ({
  createSupabaseBrowser: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

vi.mock('@memory-palace/ui', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the signup form fields', () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    render(<SignupForm />);

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('calls signUp with entered credentials and callback redirect', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/callback?next=/',
        },
      });
    });
  });

  it('shows a confirmation message when email verification is required', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Check your email to confirm your account.',
      );
    });
  });

  it('redirects to / when Supabase returns an active session', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays an error message when sign up fails', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered' },
    });

    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('User already registered');
    });
  });
});
