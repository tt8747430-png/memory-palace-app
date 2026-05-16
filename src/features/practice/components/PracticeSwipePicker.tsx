'use client';

import { usePracticePreferences, SWIPE_ACTIONS, type SwipeAction } from '../usePracticePreferences';
import { cn } from '@/ui';

const ACTION_LABELS: Record<SwipeAction, { label: string; hint: string }> = {
  again: { label: 'Forgot', hint: 'Rate Again · resets schedule' },
  hard: { label: 'Hard', hint: 'Rate Hard · short interval' },
  good: { label: 'Got it', hint: 'Rate Good · standard interval' },
  easy: { label: 'Easy', hint: 'Rate Easy · long interval' },
  skip: { label: 'Skip', hint: 'Advance without rating' },
};

export function PracticeSwipePicker() {
  const { preferences, setSwipeLeft, setSwipeRight, reset } = usePracticePreferences();

  return (
    <div className="space-y-4">
      <SwipeRow
        title="Swipe left"
        description="What happens when you swipe a card to the left."
        value={preferences.swipeLeft}
        onChange={setSwipeLeft}
        groupLabel="Swipe-left action"
      />
      <SwipeRow
        title="Swipe right"
        description="What happens when you swipe a card to the right."
        value={preferences.swipeRight}
        onChange={setSwipeRight}
        groupLabel="Swipe-right action"
      />
      <button
        type="button"
        onClick={reset}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Reset to defaults
      </button>
    </div>
  );
}

interface SwipeRowProps {
  title: string;
  description: string;
  value: SwipeAction;
  onChange: (next: SwipeAction) => void;
  groupLabel: string;
}

function SwipeRow({ title, description, value, onChange, groupLabel }: SwipeRowProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div role="radiogroup" aria-label={groupLabel} className="flex flex-wrap gap-2">
        {SWIPE_ACTIONS.map((action) => {
          const active = value === action;
          const { label, hint } = ACTION_LABELS[action];
          return (
            <button
              key={action}
              type="button"
              role="radio"
              aria-checked={active ? 'true' : 'false'}
              title={hint}
              onClick={() => onChange(action)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/60',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
