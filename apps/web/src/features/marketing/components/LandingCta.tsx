import Link from 'next/link';
import { buttonVariants, cn } from '@memory-palace/ui';

export function LandingCta() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Start building your memory today
        </h2>
        <p className="mt-4 text-muted-foreground">
          Free to use. No credit card required. Your first palace is waiting.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/join" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
            Create Your Palace
          </Link>
          <Link
            href="/about"
            className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'w-full sm:w-auto')}
          >
            Learn the Method
          </Link>
        </div>
      </div>
    </section>
  );
}
