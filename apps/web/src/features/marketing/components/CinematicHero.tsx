import Link from 'next/link';
import { Clock, Flame, TrendingUp } from 'lucide-react';
import { BlurText } from '@/shared/components/BlurText';
import { GradientText } from '@/shared/components/GradientText';

type Stat = { icon: typeof Clock; value: string; label: string };

const stats: Stat[] = [
  { icon: TrendingUp, value: '92%', label: 'Recall after 30 days' },
  { icon: Clock, value: '5 min', label: 'Daily review, average' },
  { icon: Flame, value: '7 day', label: 'Streak, typical learner' },
];

const trustWords = ['Method', 'Cathedral', 'Atlas', 'Lineage', 'Recall'];

export function CinematicHero() {
  return (
    <section className="relative flex min-h-dvh flex-col text-foreground">
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-16 text-center sm:px-6">
          <h1 className="font-heading max-w-7xl text-[2.6rem] font-normal leading-[0.95] tracking-[-1.4px] text-foreground sm:text-7xl sm:tracking-[-2.46px] md:text-8xl">
            <BlurText text="Remember" perWordDelay={60} startDelay={0.05} />{' '}
            <em className="not-italic">
              <GradientText className="italic">everything</GradientText>
            </em>{' '}
            <BlurText
              text="inside worlds you build."
              perWordDelay={60}
              startDelay={0.25}
              className="text-muted-foreground"
            />
          </h1>

          <p className="animate-fade-rise-delay mt-8 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
            An ancient mnemonic technique, made spatial. Walk through palaces of your own design,
            place ideas in vivid rooms, and watch what you put there stay there — for years, not
            days.
          </p>

          <Link
            href="/signup"
            className="animate-fade-rise-delay-2 liquid-glass mt-12 cursor-pointer rounded-full px-14 py-5 font-body text-base text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/10 hover:shadow-[0_10px_28px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-[0.98]"
          >
            Begin Journey
          </Link>

          {}
          <div className="animate-fade-rise-delay-2 mt-14 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="liquid-glass flex flex-col items-start gap-4 rounded-2xl p-5 text-left transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-foreground/[0.06]"
              >
                <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} aria-hidden="true" />
                <div className="font-heading text-4xl font-normal leading-none tracking-[-1px] text-foreground">
                  {value}
                </div>
                <div className="font-body text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="animate-fade-rise-delay-2 flex flex-col items-center gap-4 px-6 pb-12">
          <span className="liquid-glass rounded-full px-3.5 py-1 font-body text-xs text-muted-foreground">
            Five primitives, one continuous loop
          </span>
          <div className="font-heading flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-2xl italic tracking-tight text-foreground/80 sm:gap-x-14 sm:text-3xl">
            {trustWords.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
