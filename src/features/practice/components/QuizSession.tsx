'use client';

import { type SubmitEvent, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { Button, Input, cn } from '@/ui';
import { recordPractice } from '@/features/practice';
import { getQuestionContext } from '@/features/practice';
import { answerMatches } from '../lib/answer';
import type { DueNodeWithMeta } from '@/features/practice';

type Mode = 'multiple-choice' | 'typed-recall' | 'flashcard';

interface Props {
  nodes: DueNodeWithMeta[];

  initialMode?: Mode;
}

interface Question {
  node: DueNodeWithMeta;
  mode: Mode;

  options: string[];
}

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'multiple-choice', label: 'Multiple choice' },
  { value: 'typed-recall', label: 'Typed recall' },
  { value: 'flashcard', label: 'Flashcard' },
];

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function QuizSession({ nodes, initialMode = 'multiple-choice' }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<null | 'correct' | 'wrong'>(null);
  const [distractorsByNode, setDistractorsByNode] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const current = nodes[index];

  useEffect(() => {
    if (!current) return;
    if (distractorsByNode[current.id]) return;
    let cancelled = false;
    void (async () => {
      const result = await getQuestionContext({ nodeId: current.id });
      if (cancelled || !result.success) return;
      setDistractorsByNode((prev) => ({ ...prev, [current.id]: result.data.distractors }));
    })();
    return () => {
      cancelled = true;
    };
  }, [current, distractorsByNode]);

  const question: Question | null = useMemo(() => {
    if (!current) return null;
    const distractors = distractorsByNode[current.id] ?? [];

    const effectiveMode: Mode =
      mode === 'multiple-choice' && distractors.length < 1 ? 'typed-recall' : mode;
    const options =
      effectiveMode === 'multiple-choice'
        ? shuffle([current.title, ...distractors.slice(0, 3)])
        : [];
    return { node: current, mode: effectiveMode, options };
  }, [current, distractorsByNode, mode]);

  function deriveScore(correct: boolean, selfRated?: number): number {
    if (typeof selfRated === 'number') {
      return Math.max(0, Math.min(100, selfRated * 20));
    }
    return correct ? 100 : 0;
  }

  async function submit(correct: boolean, selfRated?: number) {
    if (!current || !question || isSubmitting) return;
    setIsSubmitting(true);
    setOutcome(correct ? 'correct' : 'wrong');
    const score = deriveScore(correct, selfRated);
    const result = await recordPractice({
      nodeId: current.id,
      score,
      correct,
      mode: question.mode,
    });
    if (!result.success && result.error.code === 'NOT_FOUND') {
      advance();
      return;
    }
    setIsSubmitting(false);
  }

  function advance() {
    setOutcome(null);
    setRevealed(false);
    setTyped('');
    setIsSubmitting(false);
    if (index + 1 >= nodes.length) {
      startTransition(() => router.refresh());
      return;
    }
    setIndex((i) => i + 1);
  }

  function handleChoice(option: string) {
    if (outcome) return;
    if (!current) return;
    void submit(option === current.title);
  }

  function handleTypedSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (outcome) return;
    if (!current) return;
    void submit(answerMatches(typed, current.title));
  }

  if (!current || !question) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">All caught up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You have no nodes due for review right now.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <header className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="shrink-0 tabular-nums">
          Question {index + 1} of {nodes.length}
        </span>
        <span className="min-w-0 truncate text-right">
          {current.palaceTitle} · {current.roomTitle}
        </span>
      </header>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Practice mode">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={mode === m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === m.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 hover:bg-muted',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</p>
        <h2 className="mt-1 text-xl font-semibold">{questionPrompt(question)}</h2>
        {question.mode === 'flashcard' && current.content ? (
          <div
            className={cn(
              'mt-4 rounded-md border bg-muted/40 p-4 text-sm',
              !revealed && 'cursor-pointer select-none text-muted-foreground',
            )}
            onClick={() => setRevealed(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setRevealed(true);
              }
            }}
          >
            {revealed ? current.content : 'Tap to reveal answer'}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-[calc(4.125rem+env(safe-area-inset-bottom))] -mx-4 space-y-3 border-t bg-background/95 px-4 pt-3 pb-3 backdrop-blur supports-backdrop-filter:bg-background/75 sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        {question.mode === 'multiple-choice' ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.options.map((option, i) => {
              const isCorrect = option === current.title;
              const showState = outcome !== null;
              return (
                <button
                  key={`${option}-${i}`}
                  type="button"
                  onClick={() => handleChoice(option)}
                  disabled={isSubmitting || outcome !== null}
                  className={cn(
                    'rounded-md border bg-card px-4 py-3 text-left text-sm transition-colors',
                    'hover:border-primary/50 hover:bg-muted/40',
                    showState && isCorrect && 'border-emerald-500 bg-emerald-500/10',
                    showState &&
                      !isCorrect &&
                      outcome === 'wrong' &&
                      'border-destructive bg-destructive/10',
                  )}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs">
                    {i + 1}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.mode === 'typed-recall' ? (
          <form onSubmit={handleTypedSubmit} className="flex gap-2">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type the answer…"
              autoComplete="off"
              disabled={outcome !== null}
              aria-label="Your answer"
            />
            <Button type="submit" size="lg" disabled={isSubmitting || outcome !== null}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
            </Button>
          </form>
        ) : null}

        {question.mode === 'flashcard' ? (
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={rating >= 4 ? 'primary' : 'outline'}
                size="lg"
                onClick={() => void submit(rating >= 3, rating)}
                disabled={!revealed || isSubmitting || outcome !== null}
              >
                {rating}
              </Button>
            ))}
          </div>
        ) : null}

        {outcome ? (
          <div
            className={cn(
              'flex items-center justify-between rounded-md border p-3 text-sm',
              outcome === 'correct'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-destructive/50 bg-destructive/10',
            )}
            role="status"
          >
            <span className="flex items-center gap-2 font-medium">
              {outcome === 'correct' ? (
                <>
                  <Check className="h-4 w-4" /> Correct
                </>
              ) : (
                <>
                  <X className="h-4 w-4" /> The answer was &ldquo;{current.title}&rdquo;
                </>
              )}
            </span>
            <Button size="md" onClick={advance}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function questionPrompt(q: Question): string {
  switch (q.mode) {
    case 'multiple-choice':
      return q.node.content?.trim() || `Which node matches "${truncate(q.node.title, 60)}"?`;
    case 'typed-recall':
      return q.node.content?.trim() || 'Recall the title for this node.';
    case 'flashcard':
      return q.node.title;
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
