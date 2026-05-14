'use client';

import { type ReactNode } from 'react';
import { Button } from '@/ui';
import { useAppDialog, type DialogId } from './AppDialogContext';

interface EmptyStateCreateButtonProps {
  dialogId: DialogId;
  children: ReactNode;
}

export function EmptyStateCreateButton({ dialogId, children }: EmptyStateCreateButtonProps) {
  const { open } = useAppDialog();
  return (
    <Button size="md" onClick={() => open(dialogId)}>
      {children}
    </Button>
  );
}
