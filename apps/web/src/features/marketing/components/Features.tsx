import Link from 'next/link';
import {
  Aperture,
  ArrowUpRight,
  Box,
  Brain,
  Brush,
  Camera,
  Compass,
  Layers,
  Lightbulb,
  Map as MapIcon,
  Network,
  Palette,
  PenTool,
  Quote,
  Sparkle,
  Type as TypeIcon,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Landing bento grid.
 *
 * Adapted from the "personal portfolio" bento spec into the Memory Palace
 * cinematic dark palette. Layout, sizing and rhythm follow the spec; the
 * `#0a0a0a` / `#324444` panels become `bg-cinematic` + `liquid-glass` so the
 * section keeps the orb backdrop bleeding through, and content is rewritten
 * to fit our domain (Method of Loci timeline / learner testimonial / daily
 * practice marquee / CTA).
 */

const ICON_PROPS = { strokeWidth: 1.5 } as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground/70">
      <Sparkle className="h-3 w-3" {...ICON_PROPS} aria-hidden="true" />
      <span>{children}</span>
      <Sparkle className="h-3 w-3" {...ICON_PROPS} aria-hidden="true" />
    </div>
  );
}

function StartLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground/70">
      <Sparkle className="h-3 w-3" {...ICON_PROPS} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const TIMELINE: Array<{ years: string; role: string; org: string }> = [
  { years: 'Today', role: 'Spatial canvas + SR', org: 'Memory Palace' },
  { years: '20th c.', role: 'Spaced repetition', org: 'SuperMemo / Anki' },
  { years: '15th c.', role: 'Theatres of Memory', org: 'Camillo, Bruno' },
  { years: 'Antiquity', role: 'Method of Loci', org: 'Cicero, Quintilian' },
];

function BackgroundCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-cinematic p-5 md:p-6 ring-1 ring-foreground/10">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="cinematic-aurora" style={{ opacity: 0.35 }} />
        <div className="cinematic-stars" style={{ opacity: 0.25 }} />
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <SectionLabel>The Lineage</SectionLabel>

        <div className="flex-1" />

        <div className="mt-10 grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-3 text-[12.5px] sm:text-[13px]">
          {TIMELINE.map(({ years, role, org }) => (
            <div key={years + role} className="contents">
              <span className="font-body text-foreground/85">{years}</span>
              <Sparkle className="h-3 w-3 text-foreground/60" {...ICON_PROPS} aria-hidden="true" />
              <span className="font-body text-foreground/85">{role}</span>
              <span className="text-right font-body text-muted-foreground">{org}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LearnerVoiceCard() {
  return (
    <div className="noise-overlay relative flex flex-col overflow-hidden rounded-2xl p-5 md:p-6 ring-1 ring-foreground/10 bg-[hsl(201_45%_18%)]">
      <SectionLabel>
        <span className="flex items-center gap-2">Learner voice</span>
      </SectionLabel>
      <Quote className="mt-4 h-5 w-5 text-foreground/50" {...ICON_PROPS} aria-hidden="true" />
      <p className="mt-3 font-body text-[13px] leading-[1.6] text-foreground/85 sm:text-[13.5px]">
        Six months in and my recall is almost embarrassing. I walk a palace before any exam now —
        the spatial cue does in seconds what stacks of flashcards never quite did.
      </p>
      <p className="mt-5 font-body text-[12.5px] text-muted-foreground">
        <span className="font-medium text-foreground">Elena Brooks</span>, Medical Resident —
        Halcyon
      </p>
    </div>
  );
}

function StatCard() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-cinematic p-6 ring-1 ring-foreground/10">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="cinematic-nebula" style={{ opacity: 0.4 }} />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span className="font-heading text-5xl font-light leading-none tracking-tight text-foreground drop-shadow sm:text-6xl md:text-7xl lg:text-[88px]">
          92%
        </span>
        <span className="mt-3 font-body text-sm text-foreground/85">
          Recall after 30 days, in 5 min/day.
        </span>
      </div>
    </div>
  );
}

const MARQUEE_ROW_1: LucideIcon[] = [
  Brain,
  MapIcon,
  Compass,
  Layers,
  Network,
  TypeIcon,
  Aperture,
  Lightbulb,
];
const MARQUEE_ROW_2: LucideIcon[] = [
  Camera,
  Brush,
  Box,
  Wand2,
  Palette,
  PenTool,
  TypeIcon,
  Sparkle,
];

function MarqueeRow({ icons, direction }: { icons: LucideIcon[]; direction: 'left' | 'right' }) {
  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';
  // duplicate the icon list so the loop seamlessly wraps at 50% translation
  const doubled = [...icons, ...icons];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={`flex w-max gap-3 ${animClass}`}>
        {doubled.map((Icon, i) => (
          <span
            key={i}
            className="liquid-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-foreground md:h-16 md:w-16"
          >
            <Icon className="h-6 w-6" {...ICON_PROPS} aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}

function DailyPracticeCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-cinematic p-5 md:p-6 ring-1 ring-foreground/10">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="cinematic-stars" style={{ opacity: 0.25 }} />
      </div>
      <div className="relative z-10 flex h-full flex-col gap-5">
        <SectionLabel>Daily practice</SectionLabel>
        <div className="flex-1" />
        <div className="space-y-3">
          <MarqueeRow icons={MARQUEE_ROW_1} direction="left" />
          <MarqueeRow icons={MARQUEE_ROW_2} direction="right" />
        </div>
      </div>
    </div>
  );
}

function BeginJourneyCard() {
  return (
    <div className="noise-overlay relative flex flex-col overflow-hidden rounded-2xl p-5 md:p-6 ring-1 ring-foreground/10 bg-[hsl(201_45%_18%)]">
      <div className="flex items-start justify-between gap-4">
        <StartLabel>Begin journey</StartLabel>
        <Link
          href="/signup"
          aria-label="Begin journey"
          className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-transform hover:scale-[1.05] active:scale-95"
        >
          <ArrowUpRight className="h-4 w-4" {...ICON_PROPS} aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-6 space-y-1.5 font-body">
        <p className="text-[15px] text-foreground">hello@memorypalace.app</p>
        <p className="text-[15px] text-muted-foreground">5 min / day · forever free</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="relative w-full px-4 py-12 sm:px-6 sm:py-16 md:px-10 lg:px-14 lg:py-20">
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-heading text-[28px] font-normal leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[44px]">
              Hi — Memory Palace, in three glances.
            </h2>
            <p className="mt-4 max-w-3xl font-body text-sm leading-[1.6] text-muted-foreground md:text-[15px]">
              A spatial knowledge tool with a thousand-year pedigree. Build palaces, place ideas in
              vivid rooms, and let spaced repetition keep every loci alive — five focused minutes a
              day.
            </p>
          </div>
          <Link
            href="/signup"
            className="liquid-glass shrink-0 self-start rounded-full px-5 py-2.5 font-body text-sm text-foreground transition-transform hover:scale-[1.03] sm:px-6 sm:py-3 md:self-end"
          >
            Begin Journey
          </Link>
        </div>

        {/* Bento grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {/* Column 1 */}
          <div className="md:row-span-2">
            <BackgroundCard />
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4 md:gap-5">
            <LearnerVoiceCard />
            <StatCard />
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4 md:col-span-2 md:gap-5 lg:col-span-1">
            <DailyPracticeCard />
            <BeginJourneyCard />
          </div>
        </div>
      </div>
    </section>
  );
}
