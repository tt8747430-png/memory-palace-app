'use client';

import {
  Fragment,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FileText } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  CommandShortcut,
} from '@/ui';
import { useCommandPalette } from './CommandPaletteContext';
import { useShortcutsOverlay } from './ShortcutsOverlayContext';
import { useAppDialog } from './AppDialogContext';
import { useSearch, type SearchResult } from './SearchContext';
import { signOut } from '@/shared/lib/signOut';
import { CANVAS_EVENTS } from '@/shared/lib/canvasEvents';
import {
  COMMAND_ACTIONS,
  scopeMatches,
  type CommandAction,
  type CommandGroup as ActionGroup,
} from '@/shared/lib/commandActions';

const GROUP_ORDER: readonly ActionGroup[] = ['Navigate', 'Create', 'Canvas', 'Tools'];

export function CommandPalette() {
  const { open, setOpen, closePalette } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { openOverlay } = useShortcutsOverlay();
  const { open: openDialog } = useAppDialog();
  const searchFn = useSearch();
  const [, startTransition] = useTransition();

  const [inputValue, setInputValue] = useState('');
  const deferredQuery = useDeferredValue(inputValue);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchAbortRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchFn || deferredQuery.trim().length === 0) return;
    if (searchAbortRef.current !== null) clearTimeout(searchAbortRef.current);
    searchAbortRef.current = setTimeout(() => {
      void searchFn({ query: deferredQuery.trim(), limit: 8 }).then((result) => {
        if (result.success) setSearchResults(result.data);
      });
    }, 200);
    return () => {
      if (searchAbortRef.current !== null) clearTimeout(searchAbortRef.current);
    };
  }, [deferredQuery, searchFn]);

  const visibleResults = deferredQuery.trim().length > 0 ? searchResults : [];

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setInputValue('');
      setSearchResults([]);
    }
  };

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
      openDialog,
      signOut: () => startTransition(() => void signOut()),
      dispatchCanvas: (name) => window.dispatchEvent(new CustomEvent(name)),
    });
  };

  const handleSelectResult = (result: SearchResult) => {
    closePalette();
    router.push(`/palaces/${result.palaceId}/rooms/${result.roomId}`);
  };

  const hasQuery = deferredQuery.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={[
          'inset-x-3 bottom-auto top-[max(env(safe-area-inset-top),1rem)] w-auto max-h-[80dvh]',
          'overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',

          '[&>div[aria-hidden]:first-child]:hidden [&>button]:hidden',

          'sm:inset-x-auto sm:top-[12dvh] sm:left-1/2 sm:max-h-[70dvh] sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-xl',
          'sm:data-[state=closed]:slide-out-to-top-[40%] sm:data-[state=open]:slide-in-from-top-[40%]',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
        ].join(' ')}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">
          Type to search for actions, pages, or settings. Use arrow keys to navigate.
        </DialogDescription>

        <Command
          shouldFilter={!hasQuery}
          className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            placeholder="Type a command or search…"
            autoFocus
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>

            {}
            {hasQuery && visibleResults.length > 0 && (
              <>
                <CommandGroup heading="Nodes">
                  {visibleResults.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`nodes ${result.title}`}
                      onSelect={() => handleSelectResult(result)}
                    >
                      <FileText className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      <span>{result.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

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

export { CANVAS_EVENTS };
