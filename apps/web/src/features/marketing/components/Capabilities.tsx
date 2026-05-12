import type { ReactNode } from 'react';
import { BlurText } from '@/shared/components/BlurText';

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {}
      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
    </svg>
  );
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {}
      <path d="M21 11h-2.06c-.41-2.46-2.47-4.5-4.94-4.94V4h-2v2.06c-2.47.44-4.53 2.48-4.94 4.94H5v2h2.06c.41 2.46 2.47 4.5 4.94 4.94V20h2v-2.06c2.47-.44 4.53-2.48 4.94-4.94H21v-2zm-9 5a4 4 0 110-8 4 4 0 010 8z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zM12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  );
}

type Capability = {
  icon: ReactNode;
  tags: string[];
  title: string;
  body: string;
};

const capabilities: Capability[] = [
  {
    icon: <MapIcon className="h-6 w-6 text-foreground" />,
    tags: ['Method of Loci', 'Vivid Anchors', 'Drag & Drop', 'Spatial Recall'],
    title: 'Palaces of your own',
    body: 'Place ideas in rooms across palaces you design. Spatial memory turns abstract knowledge into somewhere you can walk through.',
  },
  {
    icon: <NetworkIcon className="h-6 w-6 text-foreground" />,
    tags: ['Linked Nodes', 'Knowledge Graph', 'Semantic Edges', 'Always-Synced'],
    title: 'Connected knowledge',
    body: 'Each node connects to others by meaning. Build a graph of what you know — rooms become routes through your thinking.',
  },
  {
    icon: <LightbulbIcon className="h-6 w-6 text-foreground" />,
    tags: ['Spaced Repetition', 'Smart Review', 'Streaks', 'Review Anywhere'],
    title: 'Practice that sticks',
    body: 'Daily review baked into the walk-through. Spaced repetition keeps every loci fresh, and short sessions turn study into a habit.',
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="relative text-foreground">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 pt-24 pb-24 md:px-8">
        <header className="max-w-4xl">
          <p className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The method
          </p>
          <h2 className="font-heading text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            <BlurText text="Method of Loci," perWordDelay={70} className="text-muted-foreground" />
            <br />
            <BlurText text="evolved." perWordDelay={70} startDelay={0.25} />
          </h2>
          <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
            Three primitives, one continuous loop. Build the palace, link what you know, and let
            spaced repetition keep every loci alive.
          </p>
        </header>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {capabilities.map((cap) => (
            <article
              key={cap.title}
              className="liquid-glass flex min-h-[360px] flex-col rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass flex h-11 w-11 items-center justify-center rounded-xl">
                  {cap.icon}
                </div>
                <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
                  {cap.tags.map((tag) => (
                    <span
                      key={tag}
                      className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1" />

              <div className="mt-6">
                <h3 className="font-heading text-3xl font-normal leading-[1.05] tracking-[-1px] text-foreground md:text-4xl">
                  {cap.title}
                </h3>
                <p className="mt-3 max-w-[34ch] font-body text-sm leading-relaxed text-muted-foreground">
                  {cap.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
