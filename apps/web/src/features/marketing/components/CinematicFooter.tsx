import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

/**
 * Cinematic dark footer.
 *
 * Sits over the shared cinematic backdrop (orbs/aurora) so it stays in
 * key with the rest of the marketing flow. Uses `liquid-glass` for the
 * outer body + `bg-cinematic` for the inner panel — keeps the layered
 * “stacked card” silhouette of the original spec but in the dark palette.
 * Below the card, a giant `GlassText` wordmark renders through a
 * handcrafted SVG filter that paints inner-shadows on top of the source.
 *
 * Animations use the project's `animate-fade-rise*` CSS utilities (already
 * reduced-motion safe) instead of framer-motion's `whileInView` since the
 * shared `LazyMotion` configuration uses `domAnimation` which doesn't ship
 * the viewport observer.
 */

function LogoIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/15 ring-1 ring-foreground/25">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 20C4 20 4 14 10 10C16 6 20 4 20 4C20 4 18 8 14 14C10 20 4 20 4 20Z"
          fill="currentColor"
          className="text-foreground"
        />
        <path
          d="M4 20L10 14"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

type LinkRow = { label: string; href: string };

const PRODUCT: LinkRow[] = [
  { label: 'Palaces', href: '/dashboard' },
  { label: 'Practice', href: '/practice' },
  { label: 'Flashcards', href: '/games/flashcards' },
  { label: 'Journey', href: '/dashboard' },
];

const METHOD: LinkRow[] = [
  { label: 'Approach', href: '/about' },
  { label: 'Method of Loci', href: '/about#capabilities' },
  { label: 'Spaced Repetition', href: '/about' },
  { label: 'Streaks', href: '/about' },
];

const COMPANY: LinkRow[] = [
  { label: 'About', href: '/about' },
  { label: 'Sign In', href: '/login' },
  { label: 'Get Started', href: '/signup' },
];

const SOCIALS: Array<{
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  href: string;
}> = [
  { Icon: LinkedinIcon, label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { Icon: TwitterIcon, label: 'X / Twitter', href: 'https://x.com' },
  { Icon: GithubIcon, label: 'GitHub', href: 'https://github.com' },
];

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.78C.8 0 0 .77 0 1.73v20.54C0 23.22.8 24 1.78 24h20.44c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.73.5.7 5.54.7 11.81c0 5.02 3.22 9.27 7.69 10.77.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.71 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .94-.3 3.08 1.16a10.7 10.7 0 0 1 5.6 0c2.13-1.46 3.07-1.16 3.07-1.16.62 1.56.23 2.71.11 2.99.72.79 1.16 1.8 1.16 3.03 0 4.34-2.64 5.29-5.15 5.56.4.35.76 1.04.76 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.65.78.54 4.46-1.5 7.68-5.74 7.68-10.77C23.3 5.54 18.27.5 12 .5z" />
    </svg>
  );
}

function FooterColumn({ title, links }: { title: string; links: LinkRow[] }) {
  return (
    <div className="space-y-6">
      <h4 className="font-body text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="font-body text-[15px] font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterCard() {
  const year = new Date().getFullYear();
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Outer body — dark glass shell */}
      <div className="liquid-glass overflow-hidden rounded-[48px]">
        {/* Inner panel — deeper navy plate so the column type pops */}
        <div className="m-2 rounded-[40px] bg-cinematic shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-foreground/10">
          <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2 md:p-10 lg:grid-cols-5 lg:p-12">
            {/* Brand info */}
            <div className="space-y-8 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <LogoIcon />
                <span className="font-heading text-[26px] tracking-tight text-foreground">
                  Memory Palace<sup className="text-xs">®</sup>
                </span>
              </div>
              <p className="max-w-[320px] font-body text-base font-normal leading-relaxed text-muted-foreground">
                Spatial learning for the modern mind. Build palaces, place ideas in vivid rooms, and
                let spaced repetition keep every loci alive.
              </p>
              <div className="flex items-center gap-3">
                {SOCIALS.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="liquid-glass group flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-transform hover:scale-[1.05] active:scale-95"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <FooterColumn title="Product" links={PRODUCT} />
            <FooterColumn title="Method" links={METHOD} />
            <FooterColumn title="Company" links={COMPANY} />
          </div>
        </div>

        {/* Legal bar — outer body, outside the inner panel */}
        <div className="flex flex-col items-center justify-between gap-6 px-6 py-5 text-[15px] sm:px-12 md:flex-row md:px-16 lg:px-20">
          <p className="font-body font-medium text-muted-foreground">
            © {year} Memory Palace. All rights reserved.
          </p>
          <div className="flex items-center gap-8 font-body font-medium text-muted-foreground">
            <Link href="/about" className="transition-colors hover:text-foreground">
              Legal Center
            </Link>
            <span aria-hidden="true" className="h-4 w-px bg-foreground/20" />
            <Link href="/about" className="transition-colors hover:text-foreground">
              User Agreement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassText() {
  return (
    <div className="relative flex w-full select-none items-center justify-center pt-0">
      {/* Hidden SVG defining the glass filter referenced via `url(#glass-effect)`. */}
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#000000"
              floodOpacity="0.25"
              result="outer-shadow"
            />
            <feComponentTransfer in="SourceAlpha" result="alpha">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
            <feOffset in="alpha" dx="0" dy="4" result="offset-white" />
            <feGaussianBlur in="offset-white" stdDeviation="4" result="blur-white" />
            <feComposite in="alpha" in2="blur-white" operator="out" result="inner-white-mask" />
            <feFlood floodColor="#ffffff" floodOpacity="0.25" result="white-fill" />
            <feComposite
              in="white-fill"
              in2="inner-white-mask"
              operator="in"
              result="inner-white-final"
            />
            <feGaussianBlur in="alpha" stdDeviation="6" result="blur-black" />
            <feComposite in="alpha" in2="blur-black" operator="out" result="inner-black-mask" />
            <feFlood floodColor="#000000" floodOpacity="0.25" result="black-fill" />
            <feComposite
              in="black-fill"
              in2="inner-black-mask"
              operator="in"
              result="inner-black-final"
            />
            <feMerge>
              <feMergeNode in="outer-shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="inner-white-final" />
              <feMergeNode in="inner-black-final" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="animate-fade-rise relative">
        <h1
          className="select-none px-4 text-[min(20vw,320px)] font-heading font-normal leading-none tracking-[-0.04em] text-foreground"
          style={{ filter: 'url(#glass-effect)' }}
        >
          memory
        </h1>
      </div>
    </div>
  );
}

export function CinematicFooter() {
  return (
    <footer className="relative z-10 flex w-full flex-col items-center gap-0 px-4 pb-0 pt-16 md:px-8">
      <FooterCard />
      <GlassText />
    </footer>
  );
}
