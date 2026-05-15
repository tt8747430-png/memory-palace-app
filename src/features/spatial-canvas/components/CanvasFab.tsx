'use client';

import { Plus, MousePointer2, Hand, Grid2x2, Maximize } from 'lucide-react';
import { cn } from '@/ui';
import { useCanvasToolActions } from '../hooks/useCanvasToolActions';

interface CanvasFabProps {
  roomId: string;
}

export function CanvasFab({ roomId }: CanvasFabProps) {
  const { activeTool, setActiveTool, snapEnabled, toggleSnap, handleAddNode, fitView } =
    useCanvasToolActions(roomId);

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      className="pointer-events-auto absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur-sm md:hidden"
    >
      {}
      <button
        type="button"
        aria-label="Add node"
        onClick={handleAddNode}
        className="flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add
      </button>

      <div className="mx-0.5 h-6 w-px bg-border" />

      <button
        type="button"
        aria-label={activeTool === 'pointer' ? 'Switch to pan' : 'Switch to select'}
        aria-pressed={activeTool === 'pan'}
        onClick={() => setActiveTool(activeTool === 'pointer' ? 'pan' : 'pointer')}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          activeTool === 'pan'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {activeTool === 'pointer' ? (
          <Hand className="h-5 w-5" aria-hidden />
        ) : (
          <MousePointer2 className="h-5 w-5" aria-hidden />
        )}
      </button>

      <button
        type="button"
        aria-label={snapEnabled ? 'Snap to grid: on' : 'Snap to grid: off'}
        aria-pressed={snapEnabled}
        onClick={toggleSnap}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          snapEnabled
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Grid2x2 className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        aria-label="Fit view"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Maximize className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
