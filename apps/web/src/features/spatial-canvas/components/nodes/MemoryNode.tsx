'use client';

import { useState, useCallback } from 'react';
import type { NodeType } from '@memory-palace/db';
import { Handle, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/react';
import { m, useReducedMotion } from 'framer-motion';
import {
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link,
  Pencil,
  Trash2,
} from 'lucide-react';
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

export type MemoryNodeType = Node<MemoryNodeData, 'memoryNode'>;

const TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  text: <FileText className="h-3 w-3 shrink-0" aria-hidden />,
  image: <ImageIcon className="h-3 w-3 shrink-0" aria-hidden />,
  link: <Link className="h-3 w-3 shrink-0" aria-hidden />,
};

function isHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const NODE_VARIANTS = {
  initial: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exiting: { scale: 0.8, opacity: 0 },
} as const;

const ENTER_DURATION = 0.3;
const EXIT_DURATION = 0.2;

export function MemoryNode({ data, selected, id }: NodeProps<MemoryNodeType>) {
  const { onEditNode, onDeleteNode, onDuplicateNode } = useCanvasNodeActions();
  const hasImagePreview = data.nodeType === 'image' && isHttpUrl(data.content);
  const hasLinkContent = data.nodeType === 'link' && isHttpUrl(data.content);
  const [isExiting, setIsExiting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleDelete = useCallback(() => {
    if (shouldReduceMotion) {
      onDeleteNode(id);
      return;
    }

    setIsExiting(true);
  }, [id, onDeleteNode, shouldReduceMotion]);

  return (
    <>
      {}
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
            aria-label="Duplicate node"
            onClick={() => onDuplicateNode(id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Delete node"
            onClick={handleDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </NodeToolbar>

      {}
      <Handle
        type="target"
        position={Position.Top}
        className="h-2! w-2! border-border! bg-muted! opacity-0 group-hover:opacity-100"
      />

      {}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <m.div
            onContextMenu={(e) => e.stopPropagation()}
            style={data.color ? { borderColor: data.color } : undefined}
            variants={NODE_VARIANTS}
            initial="initial"
            animate={isExiting ? 'exiting' : 'visible'}
            transition={{
              duration: shouldReduceMotion ? 0 : isExiting ? EXIT_DURATION : ENTER_DURATION,
              ease: isExiting ? 'easeIn' : 'easeOut',
            }}
            onAnimationComplete={(definition) => {
              if (definition === 'exiting') onDeleteNode(id);
            }}
            className={cn(
              'group relative rounded-lg border bg-card px-3 py-2 shadow-sm',

              'min-h-[60px] min-w-[60px] md:min-w-[120px] md:max-w-[280px]',
              'transition-shadow duration-150 motion-reduce:transition-none',
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
            </div>

            {}
            {hasImagePreview && (
              <div className="mt-2 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.content!}
                  alt={data.title}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {}
            {hasLinkContent && (
              <a
                href={data.content!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{data.content}</span>
              </a>
            )}

            {}
            {data.nodeType === 'text' && data.content && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {data.content}
              </p>
            )}
          </m.div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEditNode(id)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Edit node
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDuplicateNode(id)}>
            <Copy className="h-4 w-4" aria-hidden />
            Duplicate node
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete node
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2! w-2! border-border! bg-muted! opacity-0 group-hover:opacity-100"
      />
    </>
  );
}
