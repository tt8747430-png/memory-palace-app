'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@memory-palace/ui';

/**
 * Inline brand mark used in the cinematic nav. Tiny SVG version of the
 * `_brand-icon.tsx` palette so we don't ship the full og-image variant in
 * the client bundle. Uses `currentColor` so it inherits the wordmark hue.
 */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5l4.5-2.5L12 1.8l3.5.7L20 5" opacity="0.85" />
      <path d="M4 5l.5 14" opacity="0.7" />
      <path d="M20 5l-.5 14" opacity="0.7" />
      <path d="M4 5L12 12M20 5L12 12M12 1.8V12M4.5 19L12 12M19.5 19L12 12" opacity="0.55" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" opacity="0.95" />
      <circle cx="12" cy="12" r="1" fill="hsl(201 100% 13%)" stroke="none" />
    </svg>
  );
}

type NavLink = { label: string; href: string };

const links: NavLink[] = [
  { label: 'Method', href: '#capabilities' },
  { label: 'Palaces', href: '#palaces' },
  { label: 'Compare', href: '#compare' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const SMOOTH_EASE = [0.25, 0.1, 0.25, 1] as const;

/**
 * Sticky floating pill nav.
 *
 * Mounted in a `sticky top-3 z-50` shell so it follows scroll. The inner
 * `liquid-glass` pill shrinks slightly + gains a stronger shadow once the
 * viewport has been scrolled past ~80 px. Mobile collapses to a hamburger
 * that opens a full-screen centered sheet — backdrop-tap, ESC key, and
 * link-tap all dismiss. Items stagger in for a more deliberate feel.
 */
export function CinematicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll + close on Escape while sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-3 z-50 mx-auto w-full max-w-5xl px-4 md:top-4">
        <m.header
          animate={{ scale: scrolled ? 0.98 : 1 }}
          transition={{ duration: 0.25, ease: SMOOTH_EASE }}
          className={cn(
            'liquid-glass relative flex items-center justify-between gap-4 rounded-full px-4 py-2.5 md:px-5 md:py-3',
            'transition-shadow duration-300',
            scrolled
              ? 'shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
              : 'shadow-[0_2px_12px_rgba(0,0,0,0.15)]',
          )}
        >
          <Link
            href="/"
            aria-label="Memory Palace home"
            className="group inline-flex items-center gap-2 text-foreground"
          >
            <BrandMark className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" />
            <span className="font-heading text-xl tracking-tight md:text-2xl">
              Memory Palace<sup className="text-[0.55em]">®</sup>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <Link
            href="/signup"
            className="hidden rounded-full bg-foreground px-5 py-2 font-body text-sm text-background shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:translate-y-0 md:inline-block"
          >
            Begin Journey
          </Link>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open ? 'true' : 'false'}
            onClick={() => setOpen((o) => !o)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10 active:scale-95 md:hidden"
          >
            <m.span
              animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }}
              transition={{ duration: 0.2, ease: SMOOTH_EASE }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </m.span>
            <m.span
              animate={{ rotate: open ? 0 : -90, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2, ease: SMOOTH_EASE }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </m.span>
          </button>
        </m.header>
      </div>

      {/* Full-screen mobile sheet — centered, with backdrop. */}
      <AnimatePresence>
        {open ? (
          <m.div
            key="sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/85 backdrop-blur-xl md:hidden"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <m.nav
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: SMOOTH_EASE }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col items-center gap-2 px-6"
            >
              {links.map((link, i) => (
                <m.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 * i + 0.1, ease: SMOOTH_EASE }}
                  className="w-full"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-2xl px-4 py-4 text-center font-heading text-3xl tracking-tight text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
                  >
                    {link.label}
                  </Link>
                </m.div>
              ))}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 * links.length + 0.1, ease: SMOOTH_EASE }}
                className="mt-4 flex w-full flex-col gap-2"
              >
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-foreground px-5 py-3.5 text-center font-body text-base text-background transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Begin Journey
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-full px-5 py-3 text-center font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
              </m.div>
            </m.nav>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
