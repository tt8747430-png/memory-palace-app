'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/ui';
import { authSubmitButtonClass } from './authStyles';

interface AuthSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

export function AuthSubmitButton({ idleLabel, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" className={authSubmitButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
