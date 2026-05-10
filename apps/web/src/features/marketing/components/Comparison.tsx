import { Check, X } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';
import { BlurText } from '@/shared/components/BlurText';

/**
 * Two-column comparison: Memory Palace vs generic flashcards.
 *
 * Mirrors the LanX "Why we stand out" split but in our voice. Each row is
 * a check/cross plus a single line of copy. Mobile collapses to two
 * stacked cards.
 */

const usPoints = [
  'Spatial encoding — every fact has a place',
  'SM-2 scheduling tuned per node',
  'Walk your palace, see what is due',
  'Export to Markdown, own your data',
  'One continuous loop: place → review → recall',
];

const themPoints = [
  'Flat lists with no spatial anchor',
  'Static intervals or none at all',
  'No sense of where knowledge lives',
  'Locked into a vendor cloud',
  'Practice feels like a chore, not a place',
];

export function Comparison() {
  return (
    <section id="compare" className="relative w-full px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-2xl">
          <SectionEyebrow>Comparison</SectionEyebrow>
          <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-[-1.2px] text-foreground md:text-5xl">
            <BlurText text="Why a palace, " perWordDelay={60} />
            <em className="not-italic text-muted-foreground">
              <BlurText text="not a stack of cards." perWordDelay={60} startDelay={0.2} />
            </em>
          </h2>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="liquid-glass-strong rounded-3xl p-8">
            <h3 className="font-heading text-2xl tracking-tight text-foreground">Memory Palace</h3>
            <p className="font-body mt-2 text-sm text-muted-foreground">
              The Method of Loci, evolved for a screen.
            </p>
            <ul className="mt-7 flex flex-col gap-4">
              {usPoints.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="font-body text-sm leading-relaxed text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="liquid-glass rounded-3xl p-8 opacity-90">
            <h3 className="font-heading text-2xl tracking-tight text-muted-foreground">Others</h3>
            <p className="font-body mt-2 text-sm text-muted-foreground/80">
              Generic flashcards and quiz apps.
            </p>
            <ul className="mt-7 flex flex-col gap-4">
              {themPoints.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose/15 text-rose">
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="font-body text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
