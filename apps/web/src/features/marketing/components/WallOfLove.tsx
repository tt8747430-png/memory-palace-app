import { Star } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';
import { BlurText } from '@/shared/components/BlurText';

/**
 * "Wall of Love" testimonials.
 *
 * Pattern from LanX: staggered grid of glass quote cards with 5 gold
 * stars + author + role. Seeded with method-of-loci / learning quotes —
 * swap in real customer voices when available.
 */

type Quote = {
  body: string;
  author: string;
  role: string;
};

const quotes: Quote[] = [
  {
    body: 'Placing ideas in rooms is the closest thing I have found to actually moving through what I know.',
    author: 'Maren H.',
    role: 'Medical student',
  },
  {
    body: 'I used to grind flashcards for an hour. Now I take a five-minute walk through my cathedral and the words just appear.',
    author: 'Daniel V.',
    role: 'Language learner',
  },
  {
    body: 'The spacing engine is invisible — I just notice that things I learned weeks ago still feel near.',
    author: 'Priya R.',
    role: 'Engineer',
  },
  {
    body: 'My loci finally make sense in software. I can keep five palaces and never confuse one with another.',
    author: 'Tomáš K.',
    role: 'Memory athlete',
  },
  {
    body: 'It feels less like an app and more like a place I visit. That changes how much I want to come back.',
    author: 'Alex M.',
    role: 'Designer',
  },
  {
    body: 'My retention 30 days out is genuinely above 90%. I have never had that with flat decks.',
    author: 'Sarah L.',
    role: 'Bible-study leader',
  },
];

export function WallOfLove() {
  return (
    <section className="relative w-full px-4 py-14 sm:px-6 md:px-10 md:py-20 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-2xl">
          <SectionEyebrow>Wall of love</SectionEyebrow>
          <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-[-1.2px] text-foreground md:text-5xl">
            <BlurText text="Builders, " perWordDelay={60} />
            <em className="not-italic text-muted-foreground">
              <BlurText text="walking their own halls." perWordDelay={60} startDelay={0.2} />
            </em>
          </h2>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <article
              key={q.author}
              className="liquid-glass flex flex-col gap-4 rounded-2xl border border-foreground/15 p-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-foreground/25 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" strokeWidth={0} />
                ))}
              </div>
              <p className="font-body text-base leading-relaxed text-foreground/90">
                &ldquo;{q.body}&rdquo;
              </p>
              <footer className="mt-auto flex items-center gap-3 pt-2">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-heading text-sm text-foreground/80"
                >
                  {q.author[0]}
                </span>
                <div className="min-w-0">
                  <div className="font-heading text-sm tracking-tight text-foreground">
                    {q.author}
                  </div>
                  <div className="font-body text-xs text-muted-foreground">{q.role}</div>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
