import {
  BookOpen,
  Brain,
  Gamepad2,
  Sparkles,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/shared/components/Reveal';

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
  /** Tailwind gradient classes for the header strip — accent palette. */
  gradient: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    Icon: BookOpen,
    title: 'Study & Quiz',
    description:
      'Multiple-choice, typed recall, and flashcards adapt to what you actually struggle with.',
    gradient: 'from-gold to-amber',
  },
  {
    Icon: Brain,
    title: 'Memorization Tools',
    description:
      'Spaced repetition powered by SM-2 picks the right node at the right time, every time.',
    gradient: 'from-emerald to-cyan',
  },
  {
    Icon: Gamepad2,
    title: 'Spatial Canvas',
    description:
      'Drag, connect, and arrange knowledge on an infinite canvas — your palace, your rules.',
    gradient: 'from-cyan to-primary',
  },
  {
    Icon: Trophy,
    title: 'Daily Streaks',
    description:
      'Build momentum with a single 5-minute review session — streaks that mean something.',
    gradient: 'from-rose to-gold',
  },
  {
    Icon: TrendingUp,
    title: 'Track Progress',
    description:
      'A statistics dashboard shows your weakest nodes, weekly activity, and recent attempts.',
    gradient: 'from-amber to-rose',
  },
  {
    Icon: Sparkles,
    title: 'Rich Content',
    description:
      'Plain text today, attachments and rich formatting on the way — your palace stays portable.',
    gradient: 'from-primary to-emerald',
  },
];

export function FeatureCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to remember
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built around how human memory actually works.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, description, gradient }, i) => (
            <Reveal key={title} delayMs={i * 80}>
              <article className="group h-full overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur-md transition-colors hover:bg-card">
                <div aria-hidden="true" className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
                <div className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-foreground transition-colors group-hover:bg-muted">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
