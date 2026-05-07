'use client';

import { useActionState } from 'react';
import { Button, Input, Label, Textarea } from '@memory-palace/ui';
import { createWizardNode } from '../../actions/createWizardNode';
import type { ActionResponse } from '@/shared/types';

interface StepAddNodeProps {
  roomId: string;
  onSuccess: () => void;
}

export function StepAddNode({ roomId, onSuccess }: StepAddNodeProps) {
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResponse<{ nodeId: string }> | null, formData: FormData) => {
      const result = await createWizardNode({
        roomId,
        title: formData.get('title') as string,
        content: (formData.get('content') as string) || undefined,
      });
      if (result.success) onSuccess();
      return result;
    },
    null,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="mb-2 text-4xl">💡</div>
        <h2 className="text-2xl font-bold">Add your first memory</h2>
        <p className="text-sm text-muted-foreground">
          A node is a single idea, fact, or concept. Start with something simple.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="node-title">Title</Label>
          <Input
            id="node-title"
            name="title"
            type="text"
            placeholder="e.g. The Roman Empire fell in 476 AD"
            maxLength={200}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-content">
            Notes <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="node-content"
            name="content"
            placeholder="Add more detail, context, or a mnemonic…"
            rows={3}
            maxLength={2000}
            disabled={isPending}
          />
        </div>

        {state && !state.success && (
          <p role="alert" className="text-sm text-destructive">
            {state.error.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving…' : 'Add to my palace'}
        </Button>
      </form>
    </div>
  );
}
