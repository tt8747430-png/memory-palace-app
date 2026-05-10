'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@memory-palace/ui';
import { SectionEyebrow } from './SectionEyebrow';
import { BlurText } from '@/shared/components/BlurText';

/**
 * Marketing FAQ accordion.
 *
 * Uses local single-open state — only one panel at a time. Plus/minus
 * icon morphs on toggle. Height animation handled by framer-motion via
 * `m.div` with explicit `height: auto`.
 */

type Item = {
  q: string;
  a: string;
};

const items: Item[] = [
  {
    q: 'Do I need to know the Method of Loci?',
    a: 'No. The product walks you through placing your first nodes in your first palace — the technique reveals itself by doing it. If you already know the method, the spatial UX will feel like home.',
  },
  {
    q: 'How is this different from Anki or other flashcard apps?',
    a: 'Anki is a flat list of cards reviewed in a queue. Memory Palace is a place you walk through. Every fact has a location, every location has neighbors, and recall feels like motion rather than recitation.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes — the canvas, journey view, and flashcard deck are all mobile-first. The full palace editor is best on a tablet or larger, but daily review fits on a phone.',
  },
  {
    q: 'Can I export my data?',
    a: 'Always. Every palace can be exported to Markdown at any time, with no paywall. Your knowledge belongs to you.',
  },
  {
    q: 'Is there spaced repetition?',
    a: 'Yes — an SM-2 scheduler runs per node, with intervals tuned by your own grades (Again / Hard / Good / Easy). Due nodes surface in the journey and the flashcard deck automatically.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes. One palace, unlimited rooms, full spacing engine, Markdown export, and the full journey + statistics views are free forever.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative w-full px-4 py-14 sm:px-6 md:px-10 md:py-20 lg:px-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <SectionEyebrow className="inline-block">FAQ</SectionEyebrow>
          <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-[-1.2px] text-foreground md:text-5xl">
            <BlurText text="Questions, " perWordDelay={60} />
            <em className="not-italic text-muted-foreground">
              <BlurText text="answered plainly." perWordDelay={60} startDelay={0.2} />
            </em>
          </h2>
        </header>

        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={item.q}
                className={cn(
                  'liquid-glass overflow-hidden rounded-2xl border border-foreground/15',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen ? 'true' : 'false'}
                  className="group/faq flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-foreground/[0.03]"
                >
                  <span className="font-heading text-lg tracking-tight text-foreground transition-colors group-hover/faq:text-foreground md:text-xl">
                    {item.q}
                  </span>
                  <m.span
                    animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                      isOpen ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground',
                    )}
                  >
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </m.span>
                </button>
                <m.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <p className="font-body px-6 pb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.a}
                  </p>
                </m.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
