'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import type { PalaceMode } from '@memory-palace/db';
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
  /** Parent palace mode — drives chapter/verse labelling and verse-hint reveal. */
  mode: PalaceMode;
  nodes: JourneyNode[];
}

/**
 * Sequential viewer over a room's nodes, ordered server-side by
 * (positionY, positionX). Keyboard: Arrow keys / space / Esc.
 *
 * UX:
 *   - Horizontal swipe (touch + mouse) advances or retreats one node.
 *   - In Bible mode, header reads "Chapter N — {room}" and the card shows
 *     a verse-N badge, optional reference chip, and a tap-to-reveal verse hint.
 *   - Animations honour `prefers-reduced-motion` globally via MotionConfig.
 */
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

  const stepLabel = isBible ? `Verse ${index + 1} of ${total}` : `Step ${index + 1} of ${total}`;
  const headerLabel = isBible
    ? `${palaceTitle} · Chapter — ${roomTitle}`
    : `${palaceTitle} · ${roomTitle}`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
            {headerLabel}
          </p>
          <p className="text-sm tabular-nums">{stepLabel}</p>
        </div>
        <Link
          href={`/palaces/${palaceId}/rooms/${roomId}`}
          aria-label="Exit journey"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>

      <div className="border-b px-4 py-3 sm:px-6">
        <JourneyStepper
          items={nodes.map((n) => ({ id: n.id, title: n.title }))}
          currentIndex={index}
          onJump={(i) => {
            setHintRevealed(false);
            setDirection(i > index ? 1 : -1);
            setIndex(i);
          }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <m.article
          key={current.id}
          drag={swipe.drag}
          dragConstraints={swipe.dragConstraints}
          dragElastic={swipe.dragElastic}
          onDragEnd={swipe.onDragEnd}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl cursor-grab touch-pan-y rounded-xl border bg-card p-8 shadow-sm active:cursor-grabbing"
          style={current.color ? { borderColor: current.color } : undefined}
        >
          {isBible ? (
            <div className="mb-3 flex items-center gap-2">
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

          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{current.title}</h2>
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

      <footer className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
        <Button variant="outline" size="md" onClick={prev} disabled={index === 0}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Swipe or use ← → to navigate
        </p>
        <Button size="md" onClick={next} disabled={index >= total - 1}>
          Next <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
