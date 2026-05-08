import Link from 'next/link';
import { buttonVariants, cn } from '@memory-palace/ui';

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="inline-flex items-center py-2 text-xl font-bold tracking-tight">
          Memory Palace
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/about"
            className="hidden items-center px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            About
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Log In
          </Link>
          <Link href="/join" className={cn(buttonVariants({ size: 'sm' }))}>
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
