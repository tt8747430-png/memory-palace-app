'use client';

import { useState, useActionState } from 'react';
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

function AvatarPreview({ src, displayName }: { src: string; displayName: string }) {
  const [imgError, setImgError] = useState(false);

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${displayName} avatar`}
        className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground ring-2 ring-border"
    >
      {initials || '?'}
    </div>
  );
}

export function ProfileForm({ displayName, avatarUrl, email }: ProfileFormProps) {
  const [state, formAction] = useActionState(profileFormAction, initialState);
  const [displayNameValue, setDisplayNameValue] = useState(displayName);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl ?? '');

  return (
    <form action={formAction} className="space-y-6">
      {/* Avatar + email read-only row */}
      <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
        <AvatarPreview src={previewUrl} displayName={displayName} />
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium leading-none">{displayName || '—'}</p>
          {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          name="displayName"
          value={displayNameValue}
          onChange={(e) => setDisplayNameValue(e.target.value)}
          placeholder="Your name"
          required
          maxLength={60}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">
          Avatar URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          value={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.value)}
          placeholder="https://example.com/avatar.png"
        />
        <p className="text-xs text-muted-foreground">
          Paste a public image URL — the preview above updates as you type.
        </p>
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
