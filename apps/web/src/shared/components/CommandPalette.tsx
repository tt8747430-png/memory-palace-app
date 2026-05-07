'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Home,
  Building2,
  Settings,
  Moon,
  Sun,
  Keyboard,
  Plus,
  DoorOpen,
  Maximize2,
  Grid3X3,
  LogOut,
  Redo2,
  Undo2,
  Copy,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@memory-palace/ui';
import { useCommandPalette } from './CommandPaletteContext';
import { useShortcutsOverlay } from './ShortcutsOverlayContext';
import { signOut } from '@/shared/lib/signOut';
import { CANVAS_EVENTS } from '@/shared/lib/canvasEvents';
import { PALACE_PAGE_RE, ROOM_ROUTE_RE } from '@/shared/lib/routes';

interface PaletteAction {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

function useActions(closePalette: () => void): { group: string; actions: PaletteAction[] }[] {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { openOverlay } = useShortcutsOverlay();
  const [, startTransition] = useTransition();
  const isOnRoomPage = ROOM_ROUTE_RE.test(pathname);
  const palacePageMatch = PALACE_PAGE_RE.exec(pathname);
  const palaceIdFromPath = palacePageMatch?.[1] ?? null;

  const navigate = useCallback(
    (href: string) => {
      closePalette();
      router.push(href);
    },
    [closePalette, router],
  );

  return [
    {
      group: 'Navigate',
      actions: [
        {
          id: 'go-home',
          label: 'Go Home',
          icon: Home,
          shortcut: 'G H',
          onSelect: () => navigate('/'),
        },
        {
          id: 'go-palaces',
          label: 'Go to Palaces',
          icon: Building2,
          shortcut: 'G P',
          onSelect: () => navigate('/palaces'),
        },
        {
          id: 'go-settings',
          label: 'Go to Settings',
          icon: Settings,
          shortcut: 'G S',
          onSelect: () => navigate('/settings'),
        },
      ],
    },
    {
      group: 'Create',
      actions: [
        {
          id: 'create-palace',
          label: 'Create New Palace',
          icon: Plus,
          shortcut: 'C P',
          onSelect: () => navigate('/palaces?action=create'),
        },
        ...(isOnRoomPage
          ? [
              {
                id: 'create-node',
                label: 'Create New Node',
                icon: Plus,
                shortcut: 'C N',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.CREATE_NODE));
                },
              } satisfies PaletteAction,
            ]
          : []),
        ...(palaceIdFromPath
          ? [
              {
                id: 'create-room',
                label: 'Create New Room',
                icon: DoorOpen,
                shortcut: 'C R',
                onSelect: () => navigate(`/palaces/${palaceIdFromPath}?action=create-room`),
              } satisfies PaletteAction,
            ]
          : []),
      ],
    },
    ...(isOnRoomPage
      ? [
          {
            group: 'Canvas',
            actions: [
              {
                id: 'canvas-fit-view',
                label: 'Fit View',
                icon: Maximize2,
                shortcut: 'F',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.FIT_VIEW));
                },
              } satisfies PaletteAction,
              {
                id: 'canvas-toggle-snap',
                label: 'Toggle Snap to Grid',
                icon: Grid3X3,
                shortcut: 'G',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.TOGGLE_SNAP));
                },
              } satisfies PaletteAction,
              {
                id: 'canvas-undo',
                label: 'Undo',
                icon: Undo2,
                shortcut: '⌘Z',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.UNDO));
                },
              } satisfies PaletteAction,
              {
                id: 'canvas-redo',
                label: 'Redo',
                icon: Redo2,
                shortcut: '⌘⇧Z',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.REDO));
                },
              } satisfies PaletteAction,
              {
                id: 'canvas-duplicate-node',
                label: 'Duplicate Selected Node(s)',
                icon: Copy,
                shortcut: '⌘D',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.DUPLICATE_NODE));
                },
              } satisfies PaletteAction,
              {
                id: 'canvas-delete-node',
                label: 'Delete Selected Node(s)',
                icon: Trash2,
                shortcut: '⌫',
                onSelect: () => {
                  closePalette();
                  window.dispatchEvent(new CustomEvent(CANVAS_EVENTS.DELETE_NODE));
                },
              } satisfies PaletteAction,
            ],
          },
        ]
      : []),
    {
      group: 'Tools',
      actions: [
        {
          id: 'toggle-theme',
          label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          icon: theme === 'dark' ? Sun : Moon,
          shortcut: 'T D',
          onSelect: () => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            closePalette();
          },
        },
        {
          id: 'show-shortcuts',
          label: 'Show Keyboard Shortcuts',
          icon: Keyboard,
          shortcut: '?',
          onSelect: () => {
            closePalette();
            openOverlay();
          },
        },
        {
          id: 'sign-out',
          label: 'Sign Out',
          icon: LogOut,
          onSelect: () => {
            closePalette();
            startTransition(() => {
              void signOut();
            });
          },
        },
      ],
    },
  ];
}

/** Full-screen command palette rendered as a Dialog.
 *  Open via Cmd/Ctrl+K or via `useCommandPalette().openPalette()`. */
export function CommandPalette() {
  const { open, setOpen, closePalette } = useCommandPalette();
  const groups = useActions(closePalette);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-xl sm:max-w-xl">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">
          Type to search for actions, pages, or settings. Use arrow keys to navigate.
        </DialogDescription>

        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search…" autoFocus />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>

            {groups.map((group, groupIdx) => (
              <span key={group.group}>
                {groupIdx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.group}>
                  {group.actions.map(({ id, label, icon: Icon, shortcut, onSelect }) => (
                    <CommandItem key={id} value={`${group.group} ${label}`} onSelect={onSelect}>
                      <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      <span>{label}</span>
                      {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </span>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
