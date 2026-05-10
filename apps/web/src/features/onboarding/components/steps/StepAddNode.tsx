'use client';

import { useActionState } from 'react';
import { Button, Input, Label, Textarea } from '@memory-palace/ui';
import { createWizardNode } from '../../actions/createWizardNode';
import type { ActionResponse } from '@/shared/types';
import {
  onboardingInputClass,
  onboardingLabelClass,
  onboardingMutedTextClass,
  onboardingSubmitButtonClass,
} from '../onboardingStyles';

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
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-3xl font-normal tracking-[-1px] text-white md:text-4xl">
          Add your first memory.
        </h2>
        <p className={`text-sm ${onboardingMutedTextClass}`}>
          A node is a single idea, fact, or concept. Start with something simple.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="node-title" className={onboardingLabelClass}>
            Title
          </Label>
          <Input
            id="node-title"
            name="title"
            type="text"
            placeholder="e.g. The Roman Empire fell in 476 AD"
            maxLength={200}
            required
            disabled={isPending}
            className={onboardingInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-content" className={onboardingLabelClass}>
            Notes <span className="text-xs text-white/40">(optional)</span>
          </Label>
          <Textarea
            id="node-content"
            name="content"
            placeholder="Add more detail, context, or a mnemonic…"
            rows={3}
            maxLength={2000}
            disabled={isPending}
            className={onboardingInputClass}
          />
        </div>

        {state && !state.success && (
          <p role="alert" className="text-sm text-rose-300">
            {state.error.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className={onboardingSubmitButtonClass}>
          {isPending ? 'Saving…' : 'Add to my palace'}
        </Button>
      </form>
    </div>
  );
}
