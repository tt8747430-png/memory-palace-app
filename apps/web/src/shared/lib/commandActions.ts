import {
  Building2,
  Copy,
  DoorOpen,
  Grid3X3,
  Home,
  Keyboard,
  LogOut,
  Maximize2,
  Moon,
  Plus,
  Redo2,
  Settings,
  Sun,
  Trash2,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { CANVAS_EVENTS } from './canvasEvents';
import { isOnRoomPage, palaceIdFromPath } from './routes';

export type CommandGroup = 'Navigate' | 'Create' | 'Canvas' | 'Tools';

/** Where the action is valid. The shortcut hook and palette both filter by this. */
export type CommandScope = 'always' | 'on-room' | 'on-palace';

export interface CommandRunContext {
  router: { push: (href: string) => void };
  pathname: string;
  setTheme: (t: 'dark' | 'light') => void;
  resolvedTheme: string | undefined;
  openOverlay: () => void;
  signOut: () => void;
  dispatchCanvas: (name: (typeof CANVAS_EVENTS)[keyof typeof CANVAS_EVENTS]) => void;
}

type DisplayCtx = Pick<CommandRunContext, 'resolvedTheme'>;

export interface CommandAction {
  id: string;
  group: CommandGroup;
  /** Palette label (static). For theme-dependent labels, also provide `getLabel`. */
  label: string;
  /** Shortcuts-overlay description. Falls back to `label` when omitted. */
  description?: string;
  /** Palette icon (static). For theme-dependent icons, also provide `getIcon`. */
  icon: LucideIcon;
  /** Optional dynamic label override evaluated at render time. */
  getLabel?: (ctx: DisplayCtx) => string;
  /** Optional dynamic icon override evaluated at render time. */
  getIcon?: (ctx: DisplayCtx) => LucideIcon;
  /** Lower-cased prefix-key chord, e.g. ['g','h']. Empty for non-chord actions. */
  chord: readonly string[];
  /** Display tokens for the overlay (one `<kbd>` per entry), e.g. ['G','H'] or ['⌘','D']. */
  keys?: readonly string[];
  /** Display string for cmdk's shortcut column (e.g. 'G H', '⌘D'). Empty hides the hint. */
  shortcutHint?: string;
  scope: CommandScope;
  run: (ctx: CommandRunContext) => void;
}

export const COMMAND_ACTIONS: readonly CommandAction[] = [
  // ── Navigate ───────────────────────────────────────────────────────────
  {
    id: 'go-home',
    group: 'Navigate',
    label: 'Go Home',
    icon: Home,
    chord: ['g', 'h'],
    keys: ['G', 'H'],
    shortcutHint: 'G H',
    scope: 'always',
    run: ({ router }) => router.push('/'),
  },
  {
    id: 'go-palaces',
    group: 'Navigate',
    label: 'Go to Palaces',
    icon: Building2,
    chord: ['g', 'p'],
    keys: ['G', 'P'],
    shortcutHint: 'G P',
    scope: 'always',
    run: ({ router }) => router.push('/palaces'),
  },
  {
    id: 'go-settings',
    group: 'Navigate',
    label: 'Go to Settings',
    icon: Settings,
    chord: ['g', 's'],
    keys: ['G', 'S'],
    shortcutHint: 'G S',
    scope: 'always',
    run: ({ router }) => router.push('/settings'),
  },

  // ── Create ─────────────────────────────────────────────────────────────
  {
    id: 'create-palace',
    group: 'Create',
    label: 'Create New Palace',
    description: 'Create new palace',
    icon: Plus,
    chord: ['c', 'p'],
    keys: ['C', 'P'],
    shortcutHint: 'C P',
    scope: 'always',
    run: ({ router }) => router.push('/palaces?action=create'),
  },
  {
    id: 'create-room',
    group: 'Create',
    label: 'Create New Room',
    description: 'Create new room (on palace page)',
    icon: DoorOpen,
    chord: ['c', 'r'],
    keys: ['C', 'R'],
    shortcutHint: 'C R',
    scope: 'on-palace',
    run: ({ router, pathname }) => {
      const id = palaceIdFromPath(pathname);
      if (id) router.push(`/palaces/${id}?action=create-room`);
    },
  },
  {
    id: 'create-node',
    group: 'Create',
    label: 'Create New Node',
    description: 'Create new node (on canvas)',
    icon: Plus,
    chord: ['c', 'n'],
    keys: ['C', 'N'],
    shortcutHint: 'C N',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.CREATE_NODE),
  },

  // ── Canvas ─────────────────────────────────────────────────────────────
  {
    id: 'canvas-fit-view',
    group: 'Canvas',
    label: 'Fit View',
    description: 'Fit all nodes in view',
    icon: Maximize2,
    chord: [],
    keys: ['F'],
    shortcutHint: 'F',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.FIT_VIEW),
  },
  {
    id: 'canvas-toggle-snap',
    group: 'Canvas',
    label: 'Toggle Snap to Grid',
    description: 'Toggle snap-to-grid',
    icon: Grid3X3,
    chord: [],
    keys: ['G'],
    shortcutHint: 'G',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.TOGGLE_SNAP),
  },
  {
    id: 'canvas-undo',
    group: 'Canvas',
    label: 'Undo',
    description: 'Undo position change',
    icon: Undo2,
    chord: [],
    keys: ['⌘', 'Z'],
    shortcutHint: '⌘Z',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.UNDO),
  },
  {
    id: 'canvas-redo',
    group: 'Canvas',
    label: 'Redo',
    description: 'Redo position change',
    icon: Redo2,
    chord: [],
    keys: ['⌘', '⇧', 'Z'],
    shortcutHint: '⌘⇧Z',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.REDO),
  },
  {
    id: 'canvas-duplicate-node',
    group: 'Canvas',
    label: 'Duplicate Selected Node(s)',
    description: 'Duplicate selected node(s) (on canvas)',
    icon: Copy,
    chord: [],
    keys: ['⌘', 'D'],
    shortcutHint: '⌘D',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.DUPLICATE_NODE),
  },
  {
    id: 'canvas-delete-node',
    group: 'Canvas',
    label: 'Delete Selected Node(s)',
    description: 'Delete selected node(s)',
    icon: Trash2,
    chord: [],
    keys: ['Del'],
    shortcutHint: '⌫',
    scope: 'on-room',
    run: ({ dispatchCanvas }) => dispatchCanvas(CANVAS_EVENTS.DELETE_NODE),
  },

  // ── Tools ──────────────────────────────────────────────────────────────
  {
    id: 'toggle-theme',
    group: 'Tools',
    label: 'Toggle Theme',
    description: 'Toggle dark / light mode',
    icon: Moon,
    getLabel: ({ resolvedTheme }) =>
      resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
    getIcon: ({ resolvedTheme }) => (resolvedTheme === 'dark' ? Sun : Moon),
    chord: ['t', 'd'],
    keys: ['T', 'D'],
    shortcutHint: 'T D',
    scope: 'always',
    run: ({ setTheme, resolvedTheme }) => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  },
  {
    id: 'show-shortcuts',
    group: 'Tools',
    label: 'Show Keyboard Shortcuts',
    description: 'Show this shortcuts overlay',
    icon: Keyboard,
    chord: [],
    keys: ['?'],
    shortcutHint: '?',
    scope: 'always',
    run: ({ openOverlay }) => openOverlay(),
  },
  {
    id: 'sign-out',
    group: 'Tools',
    label: 'Sign Out',
    icon: LogOut,
    chord: [],
    scope: 'always',
    run: ({ signOut }) => signOut(),
  },
];

const ACTION_BY_ID = new Map(COMMAND_ACTIONS.map((a) => [a.id, a]));

export function getAction(id: string): CommandAction {
  const a = ACTION_BY_ID.get(id);
  if (!a) throw new Error(`Unknown command action id: ${id}`);
  return a;
}

export function scopeMatches(scope: CommandScope, pathname: string): boolean {
  switch (scope) {
    case 'always':
      return true;
    case 'on-room':
      return isOnRoomPage(pathname);
    case 'on-palace':
      return palaceIdFromPath(pathname) !== null;
  }
}

/** Find a chord-bound action whose chord matches the given combo and is in scope. */
export function findChordAction(combo: string, pathname: string): CommandAction | undefined {
  return COMMAND_ACTIONS.find(
    (a) => a.chord.length > 0 && a.chord.join('') === combo && scopeMatches(a.scope, pathname),
  );
}
