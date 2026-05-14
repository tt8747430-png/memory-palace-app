import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '@/features/auth';
import type { AuthFormState } from '../actions/types';

const mockSignIn = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>();

vi.mock('../actions/signIn', () => ({
  signIn: (prev: AuthFormState, formData: FormData) => mockSignIn(prev, formData),
}));

vi.mock('@/ui', () => ({
  Alert: ({ children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
    <div role="alert" {...rest}>
      {children}
    </div>
  ),
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
    const { variant, size, ...rest } = props;
    void variant;
    void size;
    return <button {...rest}>{children}</button>;
  },
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  PasswordInput: ({
    showLabel,
    hideLabel,
    ...props
  }: InputHTMLAttributes<HTMLInputElement> & {
    showLabel?: string;
    hideLabel?: string;
  }) => {
    void showLabel;
    void hideLabel;
    return <input type="password" {...props} />;
  },
  Label: ({
    children,
    ...props
  }: LabelHTMLAttributes<HTMLLabelElement> & { children?: ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders labeled email and password fields', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    mockSignIn.mockResolvedValue({ status: 'idle' });
    render(<LoginForm />);
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

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
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

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'badpassword');
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

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
    await act(async () => {
      resolveAction({ status: 'idle' });
    });
  });
});
