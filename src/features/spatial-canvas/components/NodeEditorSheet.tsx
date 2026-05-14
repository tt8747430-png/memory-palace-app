'use client';

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NodeType, PalaceMode, SelectNode } from '@/db';
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
} from '@/ui';
import { cn } from '@/ui';
import { useCanvasStore } from '@/features/spatial-canvas';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useRoomNodeMutations, type NodePatch } from '../hooks/useRoomNodeMutations';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { getNodeTags, addNodeTag, removeNodeTag } from '@/features/nodes';

const NODE_TYPES: ReadonlyArray<{ value: NodeType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link' },
];

const CONTENT_LABEL: Record<NodeType, string> = {
  text: 'Content',
  image: 'Image URL',
  link: 'URL',
};

const CONTENT_PLACEHOLDER: Record<NodeType, string> = {
  text: 'Optional content or notes',
  image: 'https://example.com/image.png',
  link: 'https://example.com',
};

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const DEBOUNCE_MS = 500;
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;
const VERSE_HINT_MAX = 2_000;
const BIBLE_REF_MAX = 120;

interface NodeEditorSheetProps {
  roomId: string;

  palaceMode?: PalaceMode;
}

interface EditorState {
  title: string;
  content: string;
  nodeType: NodeType;
  color: string;
  verseHint: string;
  bibleRef: string;
}

export function NodeEditorSheet({ roomId, palaceMode = 'simple' }: NodeEditorSheetProps) {
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);
  const isMobile = useIsMobile();

  const { data: allNodes = [] } = useNodesQuery(roomId);
  const editingNode = useMemo(
    () => (editingNodeId ? (allNodes.find((n) => n.id === editingNodeId) ?? null) : null),
    [editingNodeId, allNodes],
  );

  const close = () => setEditingNodeId(null);

  const sheetContentClass = isMobile
    ? 'flex h-[92dvh] flex-col rounded-t-2xl overflow-y-auto pt-4'
    : 'flex w-full max-w-sm flex-col';

  return (
    <Sheet open={Boolean(editingNode)} onOpenChange={(open) => !open && close()}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={sheetContentClass}>
        <SheetHeader>
          <SheetTitle>Edit Node</SheetTitle>
          <SheetDescription>
            {editingNode ? `Editing "${editingNode.title}"` : 'Select a node to edit'}
          </SheetDescription>
        </SheetHeader>

        {editingNode && (
          <NodeForm
            key={editingNode.id}
            node={editingNode}
            roomId={roomId}
            palaceMode={palaceMode}
            onClose={close}
          />
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
  verseHint: (v) => ({ verseHint: v === '' ? null : v }),
  bibleRef: (v) => ({ bibleRef: v === '' ? null : v }),
};

interface NodeFormProps {
  node: SelectNode;
  roomId: string;
  palaceMode: PalaceMode;
  onClose: () => void;
}

function NodeForm({ node, roomId, palaceMode, onClose }: NodeFormProps) {
  const { patchNode, removeNode } = useRoomNodeMutations(roomId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<EditorState>({
    title: node.title,
    content: node.content ?? '',
    nodeType: node.nodeType,
    color: node.color ?? '',
    verseHint: node.verseHint ?? '',
    bibleRef: node.bibleRef ?? '',
  });

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
          <Label htmlFor="node-content">{CONTENT_LABEL[form.nodeType]}</Label>
          {form.nodeType === 'text' ? (
            <Textarea
              id="node-content"
              value={form.content}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onChange('content', e.target.value)
              }
              placeholder={CONTENT_PLACEHOLDER[form.nodeType]}
              rows={6}
              maxLength={CONTENT_MAX}
            />
          ) : (
            <Input
              id="node-content"
              type="url"
              value={form.content}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('content', e.target.value)}
              placeholder={CONTENT_PLACEHOLDER[form.nodeType]}
              maxLength={CONTENT_MAX}
            />
          )}
          {form.nodeType === 'image' && form.content && isHttpUrl(form.content) && (
            <div className="mt-2 overflow-hidden rounded-md border">
              <img
                src={form.content}
                alt="Preview"
                className="h-32 w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
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

        <TagsField nodeId={node.id} />

        {palaceMode === 'bible' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="node-bible-ref">Reference (optional)</Label>
              <Input
                id="node-bible-ref"
                value={form.bibleRef}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange('bibleRef', e.target.value)
                }
                placeholder="e.g. John 3:16"
                maxLength={BIBLE_REF_MAX}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-verse-hint">Verse hint (optional)</Label>
              <Textarea
                id="node-verse-hint"
                value={form.verseHint}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onChange('verseHint', e.target.value)
                }
                placeholder="Hint shown in journey & flashcard reviews"
                rows={3}
                maxLength={VERSE_HINT_MAX}
              />
              <p className="text-xs text-muted-foreground">
                {form.verseHint.length}/{VERSE_HINT_MAX.toLocaleString()}
              </p>
            </div>
          </>
        ) : null}

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

      <div className="sticky bottom-0 flex gap-2 border-t bg-background pt-4">
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

const nodeTagsQueryKey = (nodeId: string) => ['nodes', nodeId, 'tags'] as const;

function TagsField({ nodeId }: { nodeId: string }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: nodeTagsQueryKey(nodeId),
    queryFn: async () => {
      const res = await getNodeTags({ nodeId });
      if (!res.success) return [];
      return res.data;
    },
    staleTime: 30_000,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: nodeTagsQueryKey(nodeId) });

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    setInput('');
    startTransition(async () => {
      await addNodeTag({ nodeId, tagName: name });
      invalidate();
    });
  };

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      await removeNodeTag({ nodeId, tagId });
      invalidate();
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>

      {}
      <div className="flex flex-wrap gap-1.5">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium"
          >
            {tag.name}
            <button
              type="button"
              aria-label={`Remove tag ${tag.name}`}
              disabled={isPending}
              onClick={() => handleRemove(tag.id)}
              className={cn(
                'ml-0.5 rounded-full text-muted-foreground hover:text-foreground',
                isPending && 'pointer-events-none opacity-50',
              )}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      {}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add tag…"
          maxLength={50}
          className="h-8 flex-1 text-sm"
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label="Add tag"
          onClick={handleAdd}
          disabled={isPending || !input.trim()}
          className="h-8 w-8 p-0"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}
