'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Circle } from 'lucide-react';
import { m } from 'framer-motion';
import { CinematicBackground } from './CinematicBackground';

export type AuthStep = {
  number: number;
  text: string;
  active?: boolean;
};

type AuthShellProps = {
  brandTitle: string;

  brandSubtitle: string;

  steps?: AuthStep[];

  title: string;

  subtitle: string;

  kicker?: string;

  children: ReactNode;

  footer?: ReactNode;
};

const FADE_RISE_PARENT = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const FADE_RISE_CHILD = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function StepItem({ number, text, active }: AuthStep) {
  return (
    <li
      className={[
        'liquid-glass flex items-center gap-3 rounded-2xl px-4 py-3 font-body text-sm font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors',
          active
            ? 'bg-foreground text-[hsl(201_100%_13%)] ring-foreground'
            : 'bg-foreground/5 text-muted-foreground ring-foreground/15',
        ].join(' ')}
      >
        {number}
      </span>
      <span>{text}</span>
    </li>
  );
}

export function AuthShell({
  brandTitle,
  brandSubtitle,
  steps,
  title,
  subtitle,
  kicker,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh w-full lg:h-full">
      <aside className="relative hidden h-full w-[52%] flex-col items-center justify-end overflow-hidden rounded-3xl px-12 pb-32 shadow-2xl lg:flex">
        <CinematicBackground />

        <m.div
          variants={FADE_RISE_PARENT}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-xs space-y-8"
        >
          <m.div variants={FADE_RISE_CHILD} className="flex items-center gap-2 text-white">
            <Circle className="h-5 w-5 fill-white text-white" aria-hidden="true" />
            <span className="font-body text-xl font-semibold tracking-tight">Memory Palace</span>
          </m.div>

          <m.div variants={FADE_RISE_CHILD} className="space-y-3">
            <h2 className="font-heading text-4xl italic leading-[0.95] tracking-[-1.5px] text-white whitespace-nowrap">
              {brandTitle}
            </h2>
            <p className="font-body text-sm font-light leading-relaxed text-white/60">
              {brandSubtitle}
            </p>
          </m.div>

          {steps && steps.length > 0 ? (
            <m.ul variants={FADE_RISE_CHILD} className="space-y-2">
              {steps.map((step) => (
                <StepItem
                  key={step.number}
                  number={step.number}
                  text={step.text}
                  active={step.active}
                />
              ))}
            </m.ul>
          ) : null}
        </m.div>
      </aside>

      <section className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-12 lg:overflow-hidden lg:py-6 lg:px-16 xl:px-24">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8 sm:space-y-10 lg:space-y-6"
        >
          <Link
            href="/login"
            className="flex items-center gap-2 text-white lg:hidden"
            aria-label="Memory Palace home"
          >
            <Circle className="h-4 w-4 fill-white text-white" aria-hidden="true" />
            <span className="font-body text-base font-semibold tracking-tight">Memory Palace</span>
          </Link>

          <header className="space-y-2">
            {kicker ? (
              <p className="font-body text-xs uppercase tracking-[0.2em] text-white/40">{kicker}</p>
            ) : null}
            <h1 className="font-heading text-3xl italic leading-tight tracking-[-1px] text-white md:text-4xl">
              {title}
            </h1>
            <p className="font-body text-sm text-white/50">{subtitle}</p>
          </header>

          <div className="liquid-glass rounded-2xl p-6 md:p-8">{children}</div>

          {footer ? <p className="font-body text-sm text-white/60">{footer}</p> : null}
        </m.div>
      </section>
    </main>
  );
}
