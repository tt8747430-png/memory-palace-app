'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@memory-palace/ui';

interface JourneyNode {
  id: string;
  title: string;
  content: string | null;
  color: string | null;
}

interface Props {
  palaceId: string;
  roomId: string;
  roomTitle: string;
  palaceTitle: string;
  nodes: JourneyNode[];
}

/**
 * Sequential viewer over a room's nodes, ordered server-side by
 * (positionY, positionX). Keyboard: Arrow keys / space, Esc to exit.
 *
 * Animations use framer-motion `m` (LazyMotion is mounted at the app root).
 * Reduced-motion is honoured globally via `MotionConfig` — no local hook.
 */
export function RoomJourney({ palaceId, roomId, roomTitle, palaceTitle, nodes }: Props) {
  const [index, setIndex] = useState(0);
  const total = nodes.length;
  const current = nodes[index];

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, total - 1)));
  }, [total]);
  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  if (!current) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{roomTitle}</h1>
        <p className="text-muted-foreground">This room has no nodes yet.</p>
        <Link
          href={`/palaces/${palaceId}/rooms/${roomId}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back to canvas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
            {palaceTitle} · {roomTitle}
          </p>
          <p className="text-sm tabular-nums">
            Step {index + 1} of {total}
          </p>
        </div>
        <Link
          href={`/palaces/${palaceId}/rooms/${roomId}`}
          aria-label="Exit journey"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>

      <ol
        className="flex flex-wrap gap-1.5 border-b px-4 py-3 sm:px-6"
        aria-label="Journey progress"
      >
        {nodes.map((n, i) => (
          <li key={n.id}>
            <button
              type="button"
              aria-label={`Go to step ${i + 1}: ${n.title}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => setIndex(i)}
              className={
                i === index
                  ? 'h-2 w-6 rounded-full bg-primary transition-all'
                  : i < index
                    ? 'h-2 w-2 rounded-full bg-primary/60 transition-all hover:bg-primary'
                    : 'h-2 w-2 rounded-full bg-muted-foreground/30 transition-all hover:bg-muted-foreground/60'
              }
            />
          </li>
        ))}
      </ol>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <m.article
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl rounded-xl border bg-card p-8 shadow-sm"
          style={current.color ? { borderColor: current.color } : undefined}
        >
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{current.title}</h2>
          {current.content ? (
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {current.content}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-muted-foreground">No description yet.</p>
          )}
        </m.article>
      </main>

      <footer className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
        <Button variant="outline" size="md" onClick={prev} disabled={index === 0}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button size="md" onClick={next} disabled={index >= total - 1}>
          Next <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
