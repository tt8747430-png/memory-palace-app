'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@memory-palace/ui';

type ThemeKey = 'light' | 'dark' | 'system';

const OPTIONS: Array<{ key: ThemeKey; label: string; Icon: LucideIcon; hint: string }> = [
  { key: 'light', label: 'Light', Icon: Sun, hint: 'Always light' },
  { key: 'dark', label: 'Dark', Icon: Moon, hint: 'Always dark' },
  { key: 'system', label: 'System', Icon: Monitor, hint: 'Follow your device' },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const current: ThemeKey =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';

  return (
    <div role="radiogroup" aria-label="Color theme" className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ key, label, Icon, hint }) => {
          const active = mounted && current === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active ? 'true' : 'false'}
              onClick={() => setTheme(key)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border px-3 py-3 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card hover:bg-muted/50',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md border bg-background',
                  active && 'border-primary/40 text-primary',
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
