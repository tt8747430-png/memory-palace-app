import Link from 'next/link';
import { CinematicNav } from './CinematicNav';

/**
 * Cinematic landing hero.
 *
 * Sits inside a parent that already paints the cinematic backdrop
 * (`<CinematicBackground />` with aurora/nebula/star orbs). The hero
 * itself stays transparent so its content layers cleanly over the
 * shared orb field — no per-section background.
 */
export function CinematicHero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col text-foreground">
      <div className="relative z-10 flex flex-1 flex-col">
        <CinematicNav />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pt-20 pb-32 text-center">
          <h1 className="animate-fade-rise font-heading max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground sm:text-7xl md:text-8xl">
            Remember <em className="not-italic text-muted-foreground">everything</em> inside worlds{' '}
            <em className="not-italic text-muted-foreground">you build.</em>
          </h1>

          <p className="animate-fade-rise-delay mt-8 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
            An ancient mnemonic technique, made spatial. Walk through palaces of your own design,
            place ideas in vivid rooms, and watch what you put there stay there — for years, not
            days.
          </p>

          <Link
            href="/signup"
            className="animate-fade-rise-delay-2 liquid-glass mt-12 cursor-pointer rounded-full px-14 py-5 font-body text-base text-foreground transition-transform hover:scale-[1.03]"
          >
            Begin Journey
          </Link>
        </div>
      </div>
    </section>
  );
}
