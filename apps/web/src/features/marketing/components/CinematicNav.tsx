'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
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

/**
 * Sticky floating pill nav.
 *
 * Mounted in a `sticky top-3 z-50` shell so it follows scroll. The inner
 * `liquid-glass` pill shrinks slightly + gains a stronger shadow once the
 * viewport has been scrolled past ~80 px. Mobile collapses to a hamburger
 * that opens a slide-down sheet listing the same anchors plus the CTA.
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

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div className="sticky top-3 z-50 mx-auto w-full max-w-5xl px-4 md:top-4">
      <m.header
        animate={{ scale: scrolled ? 0.98 : 1 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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
          <BrandMark className="h-6 w-6 text-foreground transition-transform group-hover:scale-105" />
          <span className="font-heading text-xl tracking-tight md:text-2xl">
            Memory Palace<sup className="text-[0.55em]">®</sup>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/signup"
          className="hidden rounded-full bg-foreground px-5 py-2 font-body text-sm text-background transition-transform hover:scale-[1.03] md:inline-block"
        >
          Begin Journey
        </Link>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </m.header>

      {open ? (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="liquid-glass-strong absolute inset-x-4 top-[calc(100%+0.5rem)] z-50 rounded-3xl p-6 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 font-heading text-2xl tracking-tight text-foreground transition-colors hover:bg-foreground/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-foreground px-5 py-3 text-center font-body text-sm text-background"
          >
            Begin Journey
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full px-5 py-3 text-center font-body text-sm text-muted-foreground"
          >
            Sign in
          </Link>
        </m.div>
      ) : null}
    </div>
  );
}
