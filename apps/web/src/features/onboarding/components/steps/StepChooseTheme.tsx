'use client';

import { useState, useTransition } from 'react';
import { Button, cn } from '@memory-palace/ui';
import { updateWizardTheme } from '../../actions/updateWizardTheme';

const COLORS = [
  { label: 'violet', tw: 'bg-violet-600' },
  { label: 'blue', tw: 'bg-blue-600' },
  { label: 'emerald', tw: 'bg-emerald-600' },
  { label: 'amber', tw: 'bg-amber-600' },
  { label: 'rose', tw: 'bg-rose-600' },
  { label: 'slate', tw: 'bg-slate-500' },
];

const ICONS = [
  { emoji: '🏛️', label: 'Classical temple' },
  { emoji: '🏰', label: 'Castle' },
  { emoji: '🌿', label: 'Nature' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🗺️', label: 'Map' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '⚡', label: 'Energy' },
];

interface StepChooseThemeProps {
  palaceId: string;
  onSuccess: () => void;
}

export function StepChooseTheme({ palaceId, onSuccess }: StepChooseThemeProps) {
  const [color, setColor] = useState(COLORS[0]!.label);
  const [icon, setIcon] = useState(ICONS[0]!.emoji);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await updateWizardTheme({ palaceId, color, icon });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="mb-2 text-4xl" role="img" aria-label="Chosen icon">
          {icon}
        </div>
        <h2 className="text-2xl font-bold">Choose a theme</h2>
        <p className="text-sm text-muted-foreground">Give your palace a colour and icon.</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Colour</p>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-label={c.label}
                aria-pressed={color === c.label ? 'true' : 'false'}
                onClick={() => setColor(c.label)}
                className={cn(
                  'h-8 w-8 rounded-full ring-offset-2 transition-all',
                  c.tw,
                  color === c.label ? 'ring-2 ring-primary' : 'ring-0',
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Icon</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                aria-label={label}
                aria-pressed={icon === emoji ? 'true' : 'false'}
                onClick={() => setIcon(emoji)}
                className={cn(
                  'rounded-lg border p-2 text-xl transition-colors',
                  icon === emoji ? 'border-primary bg-primary/10' : 'border-border',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="button" className="w-full" onClick={handleContinue} disabled={isPending}>
        {isPending ? 'Saving…' : 'Continue'}
      </Button>
    </div>
  );
}
