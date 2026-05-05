import type { NodeType } from '@memory-palace/db';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { FileText, Image as ImageIcon, Link } from 'lucide-react';
import { cn } from '@memory-palace/ui';

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

/** Custom React Flow node. Renders as a compact card with type icon and title.
 * Handles are present but invisible — edge connections land in Phase 5D. */
export function MemoryNode({ data, selected }: NodeProps<MemoryNodeType>) {
  return (
    <div
      style={data.color ? { borderColor: data.color } : undefined}
      className={cn(
        'group relative min-w-[120px] max-w-[280px] rounded-lg border bg-card px-3 py-2 shadow-sm',
        'transition-shadow duration-150',
        selected
          ? 'border-primary shadow-md ring-2 ring-primary/30'
          : 'border-border hover:shadow-md',
      )}
    >
      {/* Top connection handle (future edges) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border !bg-muted opacity-0 group-hover:opacity-100"
      />

      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 text-muted-foreground">{TYPE_ICONS[data.nodeType]}</span>
        <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
          {data.title}
        </p>
      </div>

      {data.content && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {data.content}
        </p>
      )}

      {/* Bottom connection handle (future edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border !bg-muted opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}
