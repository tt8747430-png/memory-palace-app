export type AuthFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'check-email'; message: string };

export const initialAuthFormState: AuthFormState = { status: 'idle' };
