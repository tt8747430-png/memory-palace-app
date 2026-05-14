'use client';

import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/ui';
import { useRoomInspector } from '@/features/rooms';

export function RoomInspectorToggle() {
  const { open, toggle } = useRoomInspector();
  const Icon = open ? PanelRightClose : PanelRightOpen;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={open ? 'true' : 'false'}
      aria-label={open ? 'Close inspector' : 'Open inspector'}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        open && 'border-primary/40 bg-primary/5 text-primary',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Inspector</span>
    </button>
  );
}
