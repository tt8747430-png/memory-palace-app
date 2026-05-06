'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';

interface SelectionToolbarProps {
  roomId: string;
}

/**
 * Floating action bar that appears at the top-centre of the canvas when
 * two or more nodes are selected.
 *
 * For single-node selections, the per-node NodeToolbar (inside MemoryNode)
 * is the primary affordance. The SelectionToolbar fills the gap for batch ops.
 */
export function SelectionToolbar({ roomId }: SelectionToolbarProps) {
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const { removeNode } = useRoomNodeMutations(roomId);

  // Only render when ≥2 nodes are selected.
  if (selectedNodeIds.size < 2) return null;

  const handleDeleteSelected = () => {
    // Fire a separate optimistic mutation per selected node. Each mutation
    // cancels the same query key, so they coalesce into a single re-render.
    for (const id of selectedNodeIds) {
      removeNode.mutate({ id });
    }
    setSelectedNodeIds(new Set());
  };

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card/90 px-3 py-1.5 shadow-md backdrop-blur-sm"
    >
      <span className="text-xs font-medium text-muted-foreground">
        {selectedNodeIds.size} selected
      </span>

      <div className="h-3.5 w-px bg-border" />

      <button
        type="button"
        aria-label={`Delete ${selectedNodeIds.size} selected nodes`}
        onClick={handleDeleteSelected}
        disabled={removeNode.isPending}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
          'text-destructive hover:bg-destructive/10',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete all
      </button>
    </div>
  );
}
