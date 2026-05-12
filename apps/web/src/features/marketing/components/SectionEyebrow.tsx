import { cn } from '@memory-palace/ui';

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
