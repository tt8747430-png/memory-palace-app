'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui';
import { useShortcutsOverlay } from './ShortcutsOverlayContext';
import { getAction } from '@/shared/lib/commandActions';

interface ShortcutRow {
  keys: readonly string[];
  description: string;
}

function rowFromAction(id: string): ShortcutRow {
  const a = getAction(id);
  if (!a.keys) throw new Error(`Action "${id}" is missing overlay keys`);
  return { keys: a.keys, description: a.description ?? a.label };
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
      rowFromAction('show-shortcuts'),
      rowFromAction('toggle-theme'),
      { keys: ['Esc'], description: 'Close any open panel or modal' },
    ],
  },
  {
    heading: 'Navigation',
    rows: [rowFromAction('go-home'), rowFromAction('go-palaces'), rowFromAction('go-settings')],
  },
  {
    heading: 'Create',
    rows: [
      rowFromAction('create-palace'),
      rowFromAction('create-room'),
      rowFromAction('create-node'),
      rowFromAction('canvas-duplicate-node'),
    ],
  },
  {
    heading: 'Canvas',
    rows: [
      rowFromAction('canvas-toggle-snap'),
      rowFromAction('canvas-fit-view'),
      rowFromAction('canvas-delete-node'),

      { keys: ['Space'], description: 'Switch to pan tool (hold)' },
      { keys: ['⌘', 'A'], description: 'Select all nodes' },
      rowFromAction('canvas-undo'),
      rowFromAction('canvas-redo'),
      { keys: ['E'], description: 'Edit selected node' },
      { keys: ['/'], description: 'Search / filter canvas nodes' },
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
