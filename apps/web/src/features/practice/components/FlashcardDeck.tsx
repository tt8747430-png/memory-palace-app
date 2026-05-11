'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Button, cn, toast } from '@memory-palace/ui';
import { useSwipeNavigation } from '@/shared/hooks/useSwipeNavigation';
import { recordPractice } from '../actions/recordPractice';
import type { DueNodeWithMeta } from '../actions/getDueNodes';

type Quality = 'again' | 'hard' | 'good' | 'easy';

// Anki labels → SM-2 quality (recordPractice maps score+correct to q via srs.ts):
//   again → q 0–1, hard → q 3, good → q 4, easy → q 5
const QUALITY_TO_SCORE: Record<Quality, { score: number; correct: boolean }> = {
  again: { score: 0, correct: false },
  hard: { score: 50, correct: true },
  good: { score: 80, correct: true },
  easy: { score: 100, correct: true },
};

interface Props {
  nodes: DueNodeWithMeta[];
}

/**
 * Anki-style flashcard deck. Front shows the prompt; tap / Space flips to
 * the answer; after flip the user rates Again/Hard/Good/Easy and the deck
 * advances. Swipe left/right also navigates (after flip, swipe right
 * counts as "good"; left counts as "again" — see onDragEnd thresholds).
 *
 * Bible-mode nodes surface their `bibleRef` chip on the prompt side and
 * `verseHint` on the answer side when present.
 */
export function FlashcardDeck({ nodes }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = nodes[index];

  const advance = () => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, nodes.length));
  };
  const back = () => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  };

  // Swipe navigates the deck. After flip, the same swipe submits a default
  // rating (right = good, left = again) so the gesture has practical value.
  const swipe = useSwipeNavigation({
    onPrev: () => {
      if (flipped) void rate('again');
      else back();
    },
    onNext: () => {
      if (flipped) void rate('good');
      else advance();
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (e.key === 'ArrowLeft') {
        setFlipped(false);
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'ArrowRight') {
        setFlipped(false);
        setIndex((i) => Math.min(i + 1, nodes.length));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [nodes.length]);

  async function rate(q: Quality) {
    if (!current) return;
    const { score, correct } = QUALITY_TO_SCORE[q];
    const result = await recordPractice({
      nodeId: current.id,
      score,
      correct,
      mode: 'flashcard',
    });
    if (!result.success && result.error.code !== 'NOT_FOUND') {
      toast.error(result.error.message);
      return;
    }
    advance();
  }

  if (nodes.length === 0) {
    return (
      <div className="-mx-4 -my-6 flex min-h-[calc(100dvh-3.5rem-var(--height-bottom-nav)-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 p-8 text-center sm:-mx-6 md:min-h-dvh lg:-mx-8">
        <h2 className="text-lg font-semibold">No cards in this deck</h2>
        <p className="text-sm text-muted-foreground">
          Add some nodes to a room and they&apos;ll show up here once they&apos;re due for review.
        </p>
        <Link
          href="/palaces"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Go to palaces
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="-mx-4 -my-6 flex min-h-[calc(100dvh-3.5rem-var(--height-bottom-nav)-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 p-8 text-center sm:-mx-6 md:min-h-dvh lg:-mx-8">
        <h2 className="text-lg font-semibold">Deck complete</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ve reviewed every card in this set. Come back later for the next round.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            Reload deck
          </Button>
          <Link
            href="/games"
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Back to games
          </Link>
        </div>
      </div>
    );
  }

  const isBible = current.palaceMode === 'bible';
  const progress = nodes.length > 0 ? ((index + 1) / nodes.length) * 100 : 0;

  return (
    /*
     * Full-bleed deck. Escapes the dashboard wrapper's `mx-auto max-w-7xl
     * px-4 py-6` and sizes to viewport so the rating row is always pinned
     * to the bottom — no scroll-to-rate on mobile.
     */
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem-var(--height-bottom-nav)-env(safe-area-inset-bottom))] flex-col bg-background sm:-mx-6 md:h-dvh lg:-mx-8">
      {/* Sticky header — counter, scope, exit affordance, linear progress. */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-6">
          <span className="tabular-nums text-muted-foreground">
            Card {index + 1} of {nodes.length}
          </span>
          <span className="min-w-0 flex-1 truncate text-center text-muted-foreground">
            {current.palaceTitle} · {current.roomTitle}
          </span>
          <Link
            href="/games/flashcards"
            aria-label="Exit deck"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
        <div
          className="h-1 w-full bg-muted/60"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={nodes.length}
          aria-valuenow={index + 1}
          aria-label="Deck progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Scrollable card area — fills remaining flex space. */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 sm:py-10">
        <m.article
          key={current.id}
          drag={swipe.drag}
          dragConstraints={swipe.dragConstraints}
          dragElastic={swipe.dragElastic}
          onDragEnd={swipe.onDragEnd}
          className={cn(
            'flex w-full max-w-2xl cursor-pointer touch-pan-y select-none flex-col justify-center rounded-2xl border bg-card p-6 shadow-sm active:cursor-grabbing sm:p-8',
            'min-h-56 sm:min-h-64',
          )}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          aria-label={flipped ? 'Show prompt side' : 'Reveal answer'}
          tabIndex={0}
        >
          {!flipped ? (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {isBible ? 'Verse prompt' : 'Prompt'}
              </p>
              <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{current.title}</h2>
              {isBible && current.bibleRef ? (
                <p className="mt-3 inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-xs">
                  {current.bibleRef}
                </p>
              ) : null}
              <p className="mt-6 text-xs text-muted-foreground">Tap card or press Space to flip.</p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {isBible ? 'Verse text' : 'Answer'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-base">
                {current.content?.trim() || (
                  <em className="text-muted-foreground">No content recorded for this node.</em>
                )}
              </p>
              {isBible && current.verseHint ? (
                <p className="mt-4 rounded-md border-l-2 border-primary/40 bg-muted/40 p-3 text-sm text-muted-foreground">
                  {current.verseHint}
                </p>
              ) : null}
            </>
          )}
        </m.article>
      </main>

      {/* Sticky footer — primary action surface. Pinned above bottom nav on mobile. */}
      <footer className="sticky bottom-0 z-20 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-backdrop-filter:bg-background/75 sm:px-6">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => void rate('again')}
              className="h-14 flex-col gap-0.5 border-destructive/30 px-1 text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
            >
              <span className="text-sm font-semibold">Again</span>
              <span className="text-[10px] font-normal opacity-70">&lt; 1m</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void rate('hard')}
              className="h-14 flex-col gap-0.5 border-warning/40 px-1 text-warning-foreground hover:bg-warning/15 active:scale-[0.97]"
            >
              <span className="text-sm font-semibold">Hard</span>
              <span className="text-[10px] font-normal opacity-70">~ 6m</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void rate('good')}
              className="h-14 flex-col gap-0.5 border-success/40 px-1 text-success hover:bg-success/10 hover:text-success active:scale-[0.97]"
            >
              <span className="text-sm font-semibold">Good</span>
              <span className="text-[10px] font-normal opacity-70">~ 10m</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => void rate('easy')}
              className="h-14 flex-col gap-0.5 px-1 active:scale-[0.97]"
            >
              <span className="text-sm font-semibold">Easy</span>
              <span className="text-[10px] font-normal opacity-80">~ 4d</span>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={back}
              disabled={index === 0}
              className="h-12 flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Back</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setFlipped(true)}
              className="h-12 flex-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-1.5">Reveal</span>
            </Button>
            <Button variant="outline" size="lg" onClick={advance} className="h-12 flex-1">
              <span className="mr-1.5 hidden sm:inline">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
          Swipe or use ← → to navigate · Space to flip
        </p>
      </footer>
    </div>
  );
}
