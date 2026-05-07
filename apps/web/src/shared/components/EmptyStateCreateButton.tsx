'use client';

import { type ReactNode } from 'react';
import { Button } from '@memory-palace/ui';
import { useAppDialog, type DialogId } from './AppDialogContext';

interface EmptyStateCreateButtonProps {
  dialogId: DialogId;
  children: ReactNode;
}

/** Button that opens an AppDialog via context — used in EmptyState.action slots
 *  to avoid rendering a second dialog instance on the same page. */
export function EmptyStateCreateButton({ dialogId, children }: EmptyStateCreateButtonProps) {
  const { open } = useAppDialog();
  return (
    <Button size="md" onClick={() => open(dialogId)}>
      {children}
    </Button>
  );
}
