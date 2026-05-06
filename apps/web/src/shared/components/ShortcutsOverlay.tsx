'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@memory-palace/ui';
import { useShortcutsOverlay } from './ShortcutsOverlayContext';

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  heading: string;
  rows: ShortcutRow[];
}

const SECTIONS: ShortcutSection[] = [
  {
    heading: 'Global',
    rows: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show this shortcuts overlay' },
      { keys: ['T', 'D'], description: 'Toggle dark / light mode' },
      { keys: ['Esc'], description: 'Close any open panel or modal' },
    ],
  },
  {
    heading: 'Navigation',
    rows: [
      { keys: ['G', 'H'], description: 'Go Home' },
      { keys: ['G', 'P'], description: 'Go to Palaces' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    heading: 'Create',
    rows: [{ keys: ['C', 'P'], description: 'Create new palace' }],
  },
  {
    heading: 'Canvas',
    rows: [
      { keys: ['G'], description: 'Toggle snap-to-grid' },
      { keys: ['F'], description: 'Fit all nodes in view' },
      { keys: ['Del'], description: 'Delete selected node(s)' },
      { keys: ['Space'], description: 'Switch to pan tool (hold)' },
    ],
  },
];

function KbdKey({ label }: { label: string }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
      {label}
    </kbd>
  );
}

/** Modal overlay listing all keyboard shortcuts. Press `?` to open. Desktop only. */
export function ShortcutsOverlay() {
  const { overlayOpen, setOverlayOpen } = useShortcutsOverlay();

  return (
    <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
      <DialogContent className="hidden max-h-[80vh] overflow-y-auto sm:max-w-2xl md:block">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Press any shortcut from anywhere in the app.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SECTIONS.map(({ heading, rows }) => (
            <section key={heading}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {heading}
              </h3>
              <ul className="space-y-1.5">
                {rows.map(({ keys, description }) => (
                  <li key={description} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-foreground">{description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {keys.map((k) => (
                        <KbdKey key={k} label={k} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
