'use client';

import type { NodeType } from '@memory-palace/db';
import { Handle, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/react';
import { FileText, Image as ImageIcon, Link, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@memory-palace/ui';
import { useCanvasNodeActions } from '../../store/CanvasNodeActionsContext';

export interface MemoryNodeData extends Record<string, unknown> {
  title: string;
  content: string | null;
  nodeType: NodeType;
  color: string | null;
}

/** The full React Flow node type for MemoryNode — used as the generic param
 * for NodeProps so TypeScript knows the exact shape of `data`. */
export type MemoryNodeType = Node<MemoryNodeData, 'memoryNode'>;

const TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  text: <FileText className="h-3 w-3 shrink-0" aria-hidden />,
  image: <ImageIcon className="h-3 w-3 shrink-0" aria-hidden />,
  link: <Link className="h-3 w-3 shrink-0" aria-hidden />,
};

/**
 * Custom React Flow node rendered as a compact card.
 *
 * - **NodeToolbar**: edit/delete actions appear above the node when selected.
 * - **ContextMenu**: right-click opens an action menu.
 * - **Touch targets**: minimum 60×60px on mobile per the UI style guide.
 */
export function MemoryNode({ data, selected, id }: NodeProps<MemoryNodeType>) {
  const { onEditNode, onDeleteNode } = useCanvasNodeActions();

  return (
    <>
      {/* NodeToolbar renders via a React Flow portal — appears above the node
          when selected, without affecting the node's own DOM layout. */}
      <NodeToolbar position={Position.Top} isVisible={selected}>
        <div className="flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg">
          <button
            type="button"
            aria-label="Edit node"
            onClick={() => onEditNode(id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Delete node"
            onClick={() => onDeleteNode(id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </NodeToolbar>

      {/* Top connection handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border !bg-muted opacity-0 group-hover:opacity-100"
      />

      {/* Node card wrapped with ContextMenu. stopPropagation prevents the
          pane context menu from opening when right-clicking a node. */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onContextMenu={(e) => e.stopPropagation()}
            style={data.color ? { borderColor: data.color } : undefined}
            className={cn(
              'group relative rounded-lg border bg-card px-3 py-2 shadow-sm',
              // Minimum 60×60px touch target on mobile; compact on desktop
              'min-h-[60px] min-w-[60px] md:min-w-[120px] md:max-w-[280px]',
              'transition-shadow duration-150',
              selected
                ? 'border-primary shadow-md ring-2 ring-primary/30'
                : 'border-border hover:shadow-md',
            )}
          >
            <div className="flex items-start gap-1.5">
              <span className="mt-0.5 text-muted-foreground">{TYPE_ICONS[data.nodeType]}</span>
              <p className="flex-1 line-clamp-3 text-sm font-medium leading-snug text-foreground">
                {data.title}
              </p>
              <button
                type="button"
                aria-label="Edit node"
                onClick={() => onEditNode(id)}
                className={cn(
                  'shrink-0 rounded p-0.5 transition-colors',
                  'opacity-0 group-hover:opacity-100',
                  'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                )}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            {data.content && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {data.content}
              </p>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEditNode(id)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Edit node
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDeleteNode(id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete node
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Bottom connection handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border !bg-muted opacity-0 group-hover:opacity-100"
      />
    </>
  );
}
