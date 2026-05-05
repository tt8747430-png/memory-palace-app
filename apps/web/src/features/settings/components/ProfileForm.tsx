'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Input, Label } from '@memory-palace/ui';
import { updateProfile } from '../actions/updateProfile';

interface ProfileFormProps {
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
}

type ProfileFormState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const initialState: ProfileFormState = { status: 'idle' };

async function profileFormAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const result = await updateProfile({
    displayName: formData.get('displayName') as string,
    avatarUrl: (formData.get('avatarUrl') as string) || undefined,
  });
  if (!result.success) {
    return { status: 'error', message: result.error.message };
  }
  return { status: 'success', message: 'Profile updated successfully.' };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      {pending ? 'Saving…' : 'Save Changes'}
    </Button>
  );
}

export function ProfileForm({ displayName, avatarUrl, email }: ProfileFormProps) {
  const [state, formAction] = useActionState(profileFormAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {email ? (
        <div className="space-y-1.5">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          placeholder="Your name"
          required
          maxLength={60}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={avatarUrl ?? ''}
          placeholder="https://example.com/avatar.png"
        />
      </div>

      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      {state.status === 'success' ? <Alert role="status">{state.message}</Alert> : null}

      <SubmitButton />
    </form>
  );
}
