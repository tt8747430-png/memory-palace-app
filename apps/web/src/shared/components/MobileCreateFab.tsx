'use client';

import { Plus } from 'lucide-react';
import { useAppDialog, type DialogId } from './AppDialogContext';
import { MobileActionToolbar } from './MobileActionToolbar';

interface Props {
  dialogId: DialogId;
  label: string;
}

/**
 * md:hidden FAB that opens an AppDialog. Mounts on list pages where the
 * primary action is "create" — palaces, rooms — without coupling the FAB
 * primitive to dialog semantics.
 */
export function MobileCreateFab({ dialogId, label }: Props) {
  const { open } = useAppDialog();
  return <MobileActionToolbar actions={[{ label, Icon: Plus, onClick: () => open(dialogId) }]} />;
}
