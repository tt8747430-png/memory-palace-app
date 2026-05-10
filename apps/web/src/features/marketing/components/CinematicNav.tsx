import Link from 'next/link';

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
      {/* arch: outer columns + crown */}
      <path d="M4 5l4.5-2.5L12 1.8l3.5.7L20 5" opacity="0.85" />
      <path d="M4 5l.5 14" opacity="0.7" />
      <path d="M20 5l-.5 14" opacity="0.7" />
      {/* spokes to hub */}
      <path d="M4 5L12 12M20 5L12 12M12 1.8V12M4.5 19L12 12M19.5 19L12 12" opacity="0.55" />
      {/* hub */}
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" opacity="0.95" />
      <circle cx="12" cy="12" r="1" fill="hsl(201 100% 13%)" stroke="none" />
    </svg>
  );
}

const links: Array<{ label: string; href: string; active?: boolean }> = [
  { label: 'Home', href: '/', active: true },
  { label: 'Method', href: '#capabilities' },
  { label: 'About', href: '/about' },
  { label: 'Sign In', href: '/login' },
];

export function CinematicNav() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8">
      {/* Wordmark + brand mark */}
      <Link
        href="/"
        aria-label="Memory Palace home"
        className="group inline-flex items-center gap-2.5 text-foreground"
      >
        <BrandMark className="h-7 w-7 text-foreground transition-transform group-hover:scale-105" />
        <span className="font-heading text-3xl tracking-tight">
          Memory Palace<sup className="text-xs">®</sup>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.active
                ? 'font-body text-sm text-foreground'
                : 'font-body text-sm text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/signup"
        className="liquid-glass rounded-full px-6 py-2.5 font-body text-sm text-foreground transition-transform hover:scale-[1.03]"
      >
        Begin Journey
      </Link>
    </header>
  );
}
