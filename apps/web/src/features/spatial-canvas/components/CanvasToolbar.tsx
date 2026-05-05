'use client';

import { MousePointer2, Hand } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import type { CanvasTool } from '../store/canvasStore';

const TOOLS: { id: CanvasTool; label: string; Icon: React.ElementType }[] = [
  { id: 'pointer', label: 'Select', Icon: MousePointer2 },
  { id: 'pan', label: 'Pan', Icon: Hand },
];

/** Floating toolbar anchored at the bottom-centre of the canvas viewport.
 * Lets the user toggle between pointer (select/drag nodes) and pan mode. */
export function CanvasToolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

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
    </div>
  );
}
