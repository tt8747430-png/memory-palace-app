import Link from 'next/link';
import { buttonVariants, cn } from '@memory-palace/ui';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Subtle background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Open Beta — Free to Use
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Build Your
          <br />
          <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Memory Palace
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Master any subject using the ancient Method of Loci — visualize knowledge as places in
          your mind, link ideas spatially, and remember them forever.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/join" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
            Get Started Free
          </Link>
          <Link
            href="#how-it-works"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
          >
            See How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}
