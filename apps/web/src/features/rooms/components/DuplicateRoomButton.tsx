'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { Button, toast } from '@memory-palace/ui';
import { duplicateRoom } from '../actions/duplicateRoom';

interface DuplicateRoomButtonProps {
  id: string;
  palaceId: string;
  title: string;
}

export function DuplicateRoomButton({ id, palaceId, title }: DuplicateRoomButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await duplicateRoom({ id, palaceId });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Copied "${title}"`);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={busy || pending}
      aria-label={`Duplicate ${title}`}
      className="gap-1.5"
    >
      <Copy className="h-3.5 w-3.5" />
      {busy ? 'Copying…' : 'Duplicate'}
    </Button>
  );
}
