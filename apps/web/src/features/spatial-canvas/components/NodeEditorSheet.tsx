'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import type { NodeType, SelectNode } from '@memory-palace/db';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Input,
  Select,
  Textarea,
  Label,
} from '@memory-palace/ui';
import { useCanvasStore } from '../store/CanvasStoreContext';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useRoomNodeMutations, type NodePatch } from '../hooks/useRoomNodeMutations';

const NODE_TYPES: ReadonlyArray<{ value: NodeType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link' },
];

const DEBOUNCE_MS = 500;
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;

interface NodeEditorSheetProps {
  roomId: string;
}

interface EditorState {
  title: string;
  content: string;
  nodeType: NodeType;
  color: string;
}

/**
 * Right-side sheet for editing a node's title, content, type, and color.
 *
 * Design choices:
 *   - One coalesced debounced PATCH (500ms) instead of one mutation per field.
 *     Rapid keystrokes across multiple fields fold into a single round-trip.
 *   - NodeForm is keyed on the editing node's id so React resets all local
 *     state automatically when the user switches nodes — no derived-state dance.
 *   - On close, any pending debounce is flushed so we never drop edits.
 */
export function NodeEditorSheet({ roomId }: NodeEditorSheetProps) {
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);

  const { data: allNodes = [] } = useNodesQuery(roomId);
  const editingNode = useMemo(
    () => (editingNodeId ? (allNodes.find((n) => n.id === editingNodeId) ?? null) : null),
    [editingNodeId, allNodes],
  );

  const close = () => setEditingNodeId(null);

  return (
    <Sheet open={Boolean(editingNode)} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col">
        <SheetHeader>
          <SheetTitle>Edit Node</SheetTitle>
          <SheetDescription>
            {editingNode ? `Editing "${editingNode.title}"` : 'Select a node to edit'}
          </SheetDescription>
        </SheetHeader>

        {editingNode && (
          // key resets all NodeForm state automatically when the user switches nodes.
          <NodeForm key={editingNode.id} node={editingNode} roomId={roomId} onClose={close} />
        )}
      </SheetContent>
    </Sheet>
  );
}

const FIELD_TO_PATCH: Record<keyof EditorState, (v: string) => Partial<NodePatch>> = {
  title: (v) => ({ title: v }),
  content: (v) => ({ content: v === '' ? null : v }),
  nodeType: (v) => ({ nodeType: v as NodeType }),
  color: (v) => ({ color: v === '' ? null : v }),
};

// ─── Inner form — state initialised once from props, reset via key ────────────

interface NodeFormProps {
  node: SelectNode;
  roomId: string;
  onClose: () => void;
}

function NodeForm({ node, roomId, onClose }: NodeFormProps) {
  const { patchNode, removeNode } = useRoomNodeMutations(roomId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<EditorState>({
    title: node.title,
    content: node.content ?? '',
    nodeType: node.nodeType,
    color: node.color ?? '',
  });

  // Accumulate field changes so that rapid edits across different fields are
  // all coalesced into a single PATCH. Without this, useDebouncedCallback
  // would forward only the most recent call's arguments, silently dropping
  // earlier field changes made within the same debounce window.
  const pendingPatch = useRef<NodePatch>({});

  const flush = useDebouncedCallback(() => {
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (Object.keys(patch).length > 0) patchNode.mutate({ id: node.id, ...patch });
  }, DEBOUNCE_MS);

  const onChange = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    Object.assign(pendingPatch.current, FIELD_TO_PATCH[key](String(value)));
    flush();
  };

  const close = () => {
    flush.flush();
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    // Flush any pending edits before deleting, then close.
    flush.cancel();
    removeNode.mutate({ id: node.id });
    onClose();
  };

  return (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto py-4">
        <div className="space-y-2">
          <Label htmlFor="node-title">Title</Label>
          <Input
            id="node-title"
            value={form.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('title', e.target.value)}
            placeholder="Node title"
            maxLength={TITLE_MAX}
          />
          <p className="text-xs text-muted-foreground">
            {form.title.length}/{TITLE_MAX}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-content">Content</Label>
          <Textarea
            id="node-content"
            value={form.content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange('content', e.target.value)}
            placeholder="Optional content, images, or links"
            rows={6}
            maxLength={CONTENT_MAX}
          />
          <p className="text-xs text-muted-foreground">
            {form.content.length}/{CONTENT_MAX.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-type">Type</Label>
          <Select
            id="node-type"
            value={form.nodeType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange('nodeType', e.target.value as NodeType)
            }
          >
            {NODE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-color">Border color (optional)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="node-color"
              type="color"
              value={form.color || '#000000'}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('color', e.target.value)}
              className="h-10 w-14 cursor-pointer"
            />
            {form.color ? (
              <button
                type="button"
                onClick={() => onChange('color', '')}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">(none)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={removeNode.isPending}
          onBlur={() => setConfirmDelete(false)}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </Button>
        <Button variant="outline" onClick={close} className="flex-1">
          Done
        </Button>
      </div>
    </>
  );
}
