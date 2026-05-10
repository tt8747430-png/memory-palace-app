'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@memory-palace/ui';
import { authSubmitButtonClass } from './authStyles';

interface AuthSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

/** Reads the enclosing form's pending state via useFormStatus.
 * Must be rendered as a direct child of a <form> element. */
export function AuthSubmitButton({ idleLabel, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" className={authSubmitButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
