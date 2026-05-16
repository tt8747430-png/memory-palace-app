'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/ui';
import type { PalaceMode } from '@/db';
import { useSwipeNavigation } from '@/shared/hooks/useSwipeNavigation';
import { JourneyStepper } from './JourneyStepper';

interface JourneyNode {
  id: string;
  title: string;
  content: string | null;
  color: string | null;
  verseHint: string | null;
  bibleRef: string | null;
}

interface Props {
  palaceId: string;
  roomId: string;
  roomTitle: string;
  palaceTitle: string;

  mode: PalaceMode;
  nodes: JourneyNode[];
}

export function RoomJourney({ palaceId, roomId, roomTitle, palaceTitle, mode, nodes }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hintRevealed, setHintRevealed] = useState(false);
  const total = nodes.length;
  const current = nodes[index];
  const isBible = mode === 'bible';

  const next = useCallback(() => {
    setHintRevealed(false);
    setDirection(1);
    setIndex((i) => Math.min(i + 1, Math.max(0, total - 1)));
  }, [total]);
  const prev = useCallback(() => {
    setHintRevealed(false);
    setDirection(-1);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const swipe = useSwipeNavigation({ onPrev: prev, onNext: next });

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
      <div className="-mx-4 -my-6 flex min-h-[calc(100svh-6.125rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-4 p-8 text-center sm:-mx-6 md:min-h-svh lg:-mx-8">
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

  const stepLabel = isBible ? `Verse ${index + 1} of ${total}` : `Step ${index + 1} of ${total}`;
  const headerLabel = isBible
    ? `${palaceTitle} · Chapter — ${roomTitle}`
    : `${palaceTitle} · ${roomTitle}`;
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100svh-6.125rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col bg-background sm:-mx-6 md:h-svh lg:-mx-8">
      {}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              {headerLabel}
            </p>
            <p className="text-sm tabular-nums">{stepLabel}</p>
          </div>
          <Link
            href={`/palaces/${palaceId}/rooms/${roomId}`}
            aria-label="Exit journey"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div
          className="h-1 w-full bg-muted/60"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label="Journey progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="border-t px-4 py-2.5 sm:px-6">
          <JourneyStepper
            items={nodes.map((n) => ({ id: n.id, title: n.title }))}
            currentIndex={index}
            onJumpAction={(i) => {
              setHintRevealed(false);
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
          />
        </div>
      </header>

      {}
      <main className="flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
        <m.article
          key={current.id}
          drag={swipe.drag}
          dragConstraints={swipe.dragConstraints}
          dragElastic={swipe.dragElastic}
          onDragEnd={swipe.onDragEnd}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl cursor-grab touch-pan-y rounded-2xl border bg-card p-6 shadow-sm active:cursor-grabbing sm:p-8"
          style={current.color ? { borderColor: current.color } : undefined}
        >
          {isBible ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Verse {index + 1}
              </span>
              {current.bibleRef ? (
                <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {current.bibleRef}
                </span>
              ) : null}
            </div>
          ) : null}

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{current.title}</h2>
          {current.content ? (
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {current.content}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-muted-foreground">No description yet.</p>
          )}

          {isBible && current.verseHint ? (
            <div className="mt-6 rounded-md border border-dashed bg-muted/40 p-4">
              <button
                type="button"
                onClick={() => setHintRevealed((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {hintRevealed ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Hide hint
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Reveal hint
                  </>
                )}
              </button>
              {hintRevealed ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {current.verseHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </m.article>
      </main>

      {}
      <footer className="flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/75 sm:px-6">
        <Button
          variant="outline"
          size="md"
          onClick={prev}
          disabled={index === 0}
          className="flex-1 sm:flex-none"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Swipe or use ← → to navigate
        </p>
        <Button
          size="md"
          onClick={next}
          disabled={index >= total - 1}
          className="flex-1 sm:flex-none"
        >
          Next <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
