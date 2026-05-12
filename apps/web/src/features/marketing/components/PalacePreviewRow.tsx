'use client';

import { useEffect, useState } from 'react';
import { cn } from '@memory-palace/ui';
import { ExploreInterfaceCue } from './ExploreInterfaceCue';

type PalaceSlide = {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
};

const slides: PalaceSlide[] = [
  {
    id: 'cathedral',
    title: 'Cathedral',
    subtitle: 'Vaulted nave · 12 loci',
    gradient: 'from-[hsl(220_60%_18%)] via-[hsl(220_40%_12%)] to-[hsl(220_30%_8%)]',
  },
  {
    id: 'observatory',
    title: 'Observatory',
    subtitle: 'Domed gallery · 9 loci',
    gradient: 'from-[hsl(189_70%_20%)] via-[hsl(201_50%_14%)] to-[hsl(201_60%_10%)]',
  },
  {
    id: 'library',
    title: 'Library',
    subtitle: 'Reading hall · 18 loci',
    gradient: 'from-[hsl(38_55%_28%)] via-[hsl(38_40%_18%)] to-[hsl(20_40%_10%)]',
  },
  {
    id: 'garden',
    title: 'Garden',
    subtitle: 'Open court · 7 loci',
    gradient: 'from-[hsl(160_50%_22%)] via-[hsl(160_40%_14%)] to-[hsl(200_40%_10%)]',
  },
  {
    id: 'atelier',
    title: 'Atelier',
    subtitle: 'Workshop floor · 11 loci',
    gradient: 'from-[hsl(347_60%_28%)] via-[hsl(347_40%_18%)] to-[hsl(280_30%_10%)]',
  },
];

export function PalacePreviewRow() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <section id="palaces" className="relative w-full px-4 py-12">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {slides.map((s) => (
            <PalaceCard key={s.id} slide={s} expanded className="h-[180px]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="palaces" className="relative w-full px-6 py-16 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 max-w-2xl">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
            A walk through five palaces
          </p>
          <h3 className="mt-3 font-heading text-3xl font-normal leading-[1.05] tracking-[-1px] text-foreground md:text-4xl">
            <em className="not-italic text-muted-foreground">Hover</em> any room
          </h3>
          <ExploreInterfaceCue className="mt-4" />
        </header>
        <div className="flex h-[380px] gap-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setActiveIdx(i)}
              onFocus={() => setActiveIdx(i)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-foreground/10 text-left transition-[flex-grow] duration-500 ease-out',
                activeIdx === i ? 'flex-3' : 'flex-1',
              )}
              aria-label={`Preview ${s.title}`}
            >
              <PalaceCard slide={s} expanded={activeIdx === i} className="h-full" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PalaceCard({
  slide,
  expanded,
  className,
}: {
  slide: PalaceSlide;
  expanded: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-linear-to-br',
        slide.gradient,
        className,
      )}
    >
      {}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)]" />
      {}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-linear-to-t from-black/60 via-black/30 to-transparent p-5">
        <div className="min-w-0 flex-1">
          <div className="font-heading text-2xl italic leading-none tracking-tight text-foreground md:text-3xl">
            {slide.title}
          </div>
          <div
            className={cn(
              'mt-2 font-body text-xs text-muted-foreground transition-opacity duration-300',
              expanded ? 'opacity-100' : 'opacity-0',
            )}
          >
            {slide.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
