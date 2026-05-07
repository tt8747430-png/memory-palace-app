'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { Plus, X, MousePointer2, Hand, Grid2x2, Maximize } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';
import { getCanvasCenterFlowPos, snapPosition } from '../lib/canvasUtils';

interface CanvasFabProps {
  roomId: string;
}

interface FabAction {
  label: string;
  Icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
}

/**
 * Mobile-only Floating Action Button (md:hidden).
 *
 * Tapping the FAB expands a radial-style vertical menu with the primary
 * canvas actions. Positioned above the bottom navigation bar using
 * `safe-area-inset-bottom` so it clears iOS and Android chrome.
 */
export function CanvasFab({ roomId }: CanvasFabProps) {
  const [open, setOpen] = useState(false);

  // Close the action menu when the user presses Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const { addNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleAddNode = () => {
    const position = getCanvasCenterFlowPos(screenToFlowPosition);
    addNode.mutate({
      roomId,
      title: 'New Node',
      nodeType: 'text',
      positionX: snapPosition(position.x, 20, snapEnabled),
      positionY: snapPosition(position.y, 20, snapEnabled),
    });
    setOpen(false);
  };

  const actions: FabAction[] = [
    {
      label: 'Add node',
      Icon: Plus,
      onClick: handleAddNode,
    },
    {
      label: activeTool === 'pointer' ? 'Switch to pan' : 'Switch to select',
      Icon: activeTool === 'pointer' ? Hand : MousePointer2,
      onClick: () => {
        setActiveTool(activeTool === 'pointer' ? 'pan' : 'pointer');
        setOpen(false);
      },
      active: activeTool === 'pan',
    },
    {
      label: snapEnabled ? 'Snap: on' : 'Snap: off',
      Icon: Grid2x2,
      onClick: () => {
        toggleSnap();
        setOpen(false);
      },
      active: snapEnabled,
    },
    {
      label: 'Fit view',
      Icon: Maximize,
      onClick: () => {
        fitView({ padding: 0.2, duration: 300 });
        setOpen(false);
      },
    },
  ];

  return (
    // md:hidden — CanvasToolbar handles larger screens.
    // --fab-bottom uses env(safe-area-inset-bottom) so the FAB clears iOS/Android system chrome.
    <div
      className="absolute right-4 z-20 flex flex-col items-end gap-2 bottom-(--fab-bottom) md:hidden"
      style={{ '--fab-bottom': 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' } as CSSProperties}
    >
      {/* Expanded action items */}
      {open && (
        <div role="menu" aria-label="Canvas actions" className="flex flex-col items-end gap-2">
          {actions.map(({ label, Icon, onClick, active }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              aria-label={label}
              onClick={onClick}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-colors',
                'border bg-card/90 backdrop-blur-sm',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-foreground hover:bg-accent',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        type="button"
        aria-label={open ? 'Close canvas actions' : 'Open canvas actions'}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 active:scale-95',
        )}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Plus className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
