'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@memory-palace/ui';

const NEXT_THEME = { light: 'dark', dark: 'system', system: 'light' } as const;
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const LABEL = {
  light: 'Switch to dark theme',
  dark: 'Switch to system theme',
  system: 'Switch to light theme',
} as const;

type ThemeKey = keyof typeof NEXT_THEME;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" aria-hidden disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const current: ThemeKey = theme === 'dark' || theme === 'light' ? theme : 'system';
  const Icon = ICON[current];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label={LABEL[current]}
      onClick={() => setTheme(NEXT_THEME[current])}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
