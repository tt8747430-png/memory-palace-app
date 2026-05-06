'use client';

import { useState } from 'react';
import { Plus, X, MousePointer2, Hand, Grid2x2, Maximize } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';

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

  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const { addNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleAddNode = () => {
    const container = document.querySelector('[data-testid="canvas-container"]');
    const rect = container?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 200;
    const cy = rect ? rect.height / 2 : 300;
    const position = screenToFlowPosition({ x: cx + (rect?.left ?? 0), y: cy + (rect?.top ?? 0) });
    addNode.mutate({
      roomId,
      title: 'New Node',
      nodeType: 'text',
      positionX: Math.round(position.x),
      positionY: Math.round(position.y),
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
      active: false,
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
    // md:hidden — CanvasToolbar handles larger screens
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 md:hidden">
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
        aria-expanded={open}
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
