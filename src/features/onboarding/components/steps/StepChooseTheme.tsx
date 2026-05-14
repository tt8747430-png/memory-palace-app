'use client';

import { useState, useTransition } from 'react';
import { Button, cn } from '@/ui';
import { updateWizardTheme } from '../../actions/updateWizardTheme';
import { onboardingMutedTextClass, onboardingSubmitButtonClass } from '../onboardingStyles';

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
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-3xl font-normal tracking-[-1px] text-white md:text-4xl">
          Choose a theme.
        </h2>
        <p className={`text-sm ${onboardingMutedTextClass}`}>Give your palace a colour and icon.</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-3 font-body text-sm font-medium text-white">Colour</p>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-label={c.label}
                aria-pressed={color === c.label ? 'true' : 'false'}
                onClick={() => setColor(c.label)}
                className={cn(
                  'h-9 w-9 rounded-full ring-offset-2 ring-offset-transparent transition-all',
                  c.tw,
                  color === c.label ? 'ring-2 ring-white' : 'ring-0',
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 font-body text-sm font-medium text-white">Icon</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                aria-label={label}
                aria-pressed={icon === emoji ? 'true' : 'false'}
                onClick={() => setIcon(emoji)}
                className={cn(
                  'liquid-glass rounded-xl p-2 text-xl transition-transform hover:scale-[1.05]',
                  icon === emoji ? 'bg-white/15 ring-2 ring-white' : 'bg-transparent',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={handleContinue}
        disabled={isPending}
        className={onboardingSubmitButtonClass}
      >
        {isPending ? 'Saving…' : 'Continue'}
      </Button>
    </div>
  );
}
