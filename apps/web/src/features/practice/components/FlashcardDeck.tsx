'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
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
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">No cards in this deck</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add some nodes to a room and they&apos;ll show up here once they&apos;re due for review.
        </p>
        <Link
          href="/palaces"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Go to palaces
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Deck complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ve reviewed every card in this set. Come back later for the next round.
        </p>
        <div className="mt-4 flex justify-center gap-2">
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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Card {index + 1} of {nodes.length}
        </span>
        <span className="truncate">
          {current.palaceTitle} · {current.roomTitle}
        </span>
      </header>

      <m.article
        drag={swipe.drag}
        dragConstraints={swipe.dragConstraints}
        dragElastic={swipe.dragElastic}
        onDragEnd={swipe.onDragEnd}
        className={cn(
          'min-h-[16rem] cursor-pointer select-none rounded-xl border bg-card p-8 shadow-sm',
          'flex flex-col justify-center',
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
            <h2 className="mt-2 text-xl font-semibold">{current.title}</h2>
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

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="outline" onClick={() => void rate('again')}>
            Again
          </Button>
          <Button variant="outline" onClick={() => void rate('hard')}>
            Hard
          </Button>
          <Button variant="outline" onClick={() => void rate('good')}>
            Good
          </Button>
          <Button variant="primary" onClick={() => void rate('easy')}>
            Easy
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={back} disabled={index === 0} className="flex-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Back</span>
          </Button>
          <Button variant="primary" onClick={() => setFlipped(true)} className="flex-[2]">
            <RotateCcw className="h-4 w-4" />
            <span className="ml-1.5">Reveal</span>
          </Button>
          <Button variant="outline" onClick={advance} className="flex-1">
            <span className="mr-1.5 hidden sm:inline">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Swipe or use ← → to navigate · Space to flip
      </p>
    </div>
  );
}
