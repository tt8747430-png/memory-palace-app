'use client';

import { Fragment, useMemo, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import {
  COMMAND_ACTIONS,
  scopeMatches,
  type CommandAction,
  type CommandGroup as ActionGroup,
} from '@/shared/lib/commandActions';

const GROUP_ORDER: readonly ActionGroup[] = ['Navigate', 'Create', 'Canvas', 'Tools'];

/** Full-screen command palette rendered as a Dialog.
 *  Open via Cmd/Ctrl+K or via `useCommandPalette().openPalette()`. */
export function CommandPalette() {
  const { open, setOpen, closePalette } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { openOverlay } = useShortcutsOverlay();
  const [, startTransition] = useTransition();

  const groups = useMemo(() => {
    const visible = COMMAND_ACTIONS.filter((a) => scopeMatches(a.scope, pathname));
    return GROUP_ORDER.flatMap((group) => {
      const actions = visible.filter((a) => a.group === group);
      return actions.length > 0 ? [{ group, actions }] : [];
    });
  }, [pathname]);

  const runAction = (action: CommandAction) => {
    closePalette();
    action.run({
      router,
      pathname,
      setTheme,
      resolvedTheme,
      openOverlay,
      signOut: () => startTransition(() => void signOut()),
      dispatchCanvas: (name) => window.dispatchEvent(new CustomEvent(name)),
    });
  };

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

            {groups.map(({ group, actions }, groupIdx) => (
              <Fragment key={group}>
                {groupIdx > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {actions.map((action) => {
                    const label = action.getLabel?.({ resolvedTheme }) ?? action.label;
                    const Icon = action.getIcon?.({ resolvedTheme }) ?? action.icon;
                    return (
                      <CommandItem
                        key={action.id}
                        value={`${group} ${label}`}
                        onSelect={() => runAction(action)}
                      >
                        <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        <span>{label}</span>
                        {action.shortcutHint && (
                          <CommandShortcut>{action.shortcutHint}</CommandShortcut>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Re-export so external imports continue to compile.
export { CANVAS_EVENTS };
