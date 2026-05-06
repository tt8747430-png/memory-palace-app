'use client';

import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
} from '@memory-palace/ui';

/** Shape of a search result row — mirrors the server action's return type. */
export interface SearchResult {
  id: string;
  title: string;
  content: string | null;
  nodeType: string;
  roomId: string;
  createdAt: Date;
}

interface SearchDialogProps {
  /** Server action to execute the search. Injected to avoid cross-feature imports. */
  onSearch: (input: {
    query: string;
    limit: number;
  }) => Promise<
    | { success: true; data: SearchResult[] }
    | { success: false; error: { code: string; message: string } }
  >;
  /** Called when the user selects a result. */
  onSelect?: (result: SearchResult) => void;
}

/** Cross-cutting search dialog for full-text node search.
 *
 * Placed in shared/ with the search action injected via props to avoid
 * cross-feature dependency violations (shared → feature). */
export function SearchDialog({ onSearch, onSelect }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setError(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await onSearch({ query: query.trim(), limit: 20 });
      if (!result.success) {
        setError(result.error.message);
        setResults([]);
      } else {
        setResults(result.data);
        setError(null);
      }
      setSearched(true);
    });
  }

  function handleSelect(node: SearchResult) {
    setOpen(false);
    onSelect?.(node);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Search nodes"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Nodes</DialogTitle>
            <DialogDescription>
              Full-text search across all your nodes. Supports AND, OR, and -negation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Roman history -modern"
              disabled={isPending}
              autoFocus
            />
            <Button type="submit" size="md" disabled={isPending || !query.trim()}>
              {isPending ? 'Searching…' : 'Search'}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {searched && !error && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No nodes found for &ldquo;{query}&rdquo;
                </p>
              ) : (
                <ul className="divide-y" role="list">
                  {results.map((node) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(node)}
                        className="flex w-full flex-col gap-0.5 px-2 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <span className="text-sm font-medium">{node.title}</span>
                        {node.content && (
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {node.content}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground/70">
                          {node.nodeType} · created {new Date(node.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
