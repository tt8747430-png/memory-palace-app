import { cn } from '@memory-palace/ui';

/**
 * Small uppercase tag pill used at the top of each marketing section to
 * establish reading rhythm. Mirrors the `BENEFITS` / `PRICING & PLANS` /
 * `WALL OF LOVE` eyebrows on landerx.framer.website.
 */
type SectionEyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        'font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}
