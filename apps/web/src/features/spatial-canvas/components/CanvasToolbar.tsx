'use client';

import { Plus, MousePointer2, Hand } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import type { CanvasTool } from '../store/canvasStore';
import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';

const TOOLS: { id: CanvasTool; label: string; Icon: React.ElementType }[] = [
  { id: 'pointer', label: 'Select', Icon: MousePointer2 },
  { id: 'pan', label: 'Pan', Icon: Hand },
];

interface CanvasToolbarProps {
  roomId: string;
}

/** Floating toolbar anchored at the bottom-centre of the canvas viewport.
 * Lets the user toggle between pointer (select/drag nodes) and pan mode,
 * and create new nodes at the viewport centre. */
export function CanvasToolbar({ roomId }: CanvasToolbarProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const { addNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition } = useReactFlow();

  const handleAddNode = () => {
    // Place the new node at the centre of the current viewport.
    // screenToFlowPosition converts pixel-space (screen) coordinates to
    // the React Flow canvas coordinate system, accounting for zoom & pan.
    const container = document.querySelector('[data-testid="canvas-container"]');
    const rect = container?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 400;
    const cy = rect ? rect.height / 2 : 300;

    const position = screenToFlowPosition({ x: cx + (rect?.left ?? 0), y: cy + (rect?.top ?? 0) });

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
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/90 p-1 shadow-md backdrop-blur-sm"
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
