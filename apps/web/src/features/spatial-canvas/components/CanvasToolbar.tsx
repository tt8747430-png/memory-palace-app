'use client';

import { Plus, MousePointer2, Hand, Grid2x2, Maximize } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import type { CanvasTool } from '../store/canvasStore';
import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';
import { getCanvasCenterFlowPos } from '../lib/canvasUtils';

const TOOLS: { id: CanvasTool; label: string; Icon: React.ElementType }[] = [
  { id: 'pointer', label: 'Select (V)', Icon: MousePointer2 },
  { id: 'pan', label: 'Pan (H)', Icon: Hand },
];

interface CanvasToolbarProps {
  roomId: string;
}

/**
 * Floating toolbar anchored at the bottom-centre of the canvas viewport.
 * Desktop-only (`hidden md:flex`) — replaced by `CanvasFab` on mobile.
 */
export function CanvasToolbar({ roomId }: CanvasToolbarProps) {
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
      positionX: Math.round(position.x),
      positionY: Math.round(position.y),
    });
  };

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      // Hidden on mobile — CanvasFab handles small screens
      className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/90 p-1 shadow-md backdrop-blur-sm md:flex"
    >
      {TOOLS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={activeTool === id}
          onClick={() => setActiveTool(id)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            activeTool === id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}

      {/* Divider */}
      <div className="mx-0.5 h-5 w-px bg-border" />

      {/* Snap-to-grid toggle — `G` key shortcut wired in RoomCanvas */}
      <button
        type="button"
        aria-label={snapEnabled ? 'Snap to grid: on (G)' : 'Snap to grid: off (G)'}
        aria-pressed={snapEnabled}
        onClick={toggleSnap}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          snapEnabled
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Grid2x2 className="h-4 w-4" aria-hidden />
      </button>

      {/* Fit view */}
      <button
        type="button"
        aria-label="Fit view"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Maximize className="h-4 w-4" aria-hidden />
      </button>

      {/* Divider */}
      <div className="mx-0.5 h-5 w-px bg-border" />

      {/* Add node */}
      <button
        type="button"
        aria-label="Add node"
        onClick={handleAddNode}
        disabled={addNode.isPending}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
