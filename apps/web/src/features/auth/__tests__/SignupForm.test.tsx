import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from '../components/SignupForm';
import type { AuthFormState } from '../actions/types';

const mockSignUp = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();

vi.mock('../actions/signUp', () => ({
  signUp: (prev: AuthFormState, formData: FormData) => mockSignUp(prev, formData),
}));

vi.mock('@memory-palace/ui', () => ({
  Alert: ({ children, role = 'status', ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
    <div role={role} {...rest}>
      {children}
    </div>
  ),
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
    const { variant, size, ...rest } = props;
    void variant;
    void size;
    return <button {...rest}>{children}</button>;
  },
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
  });

  it('renders labeled email and password fields', () => {
    mockSignUp.mockResolvedValue({ status: 'idle' });
    render(<SignupForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    render(<SignupForm />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('forwards typed credentials to the signUp action via FormData', async () => {
    mockSignUp.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    const [, formData] = mockSignUp.mock.calls[0]!;
    expect(formData.get('email')).toBe('new@example.com');
    expect(formData.get('password')).toBe('password123');
  });

  it('shows the check-email message when the action returns check-email', async () => {
    mockSignUp.mockResolvedValue({
      status: 'check-email',
      message: 'Check your email to confirm your account.',
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your email to confirm your account.',
    );
  });

  it('displays the error message returned by the action', async () => {
    mockSignUp.mockResolvedValue({ status: 'error', message: 'User already registered' });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('User already registered');
  });
});
