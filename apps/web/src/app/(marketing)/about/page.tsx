import type { Metadata } from 'next';
import Link from 'next/link';
import { CinematicBackground, CinematicNav, CinematicFooter } from '@/features/marketing';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About — Memory Palace',
  description:
    'Learn about the Method of Loci, the ancient technique behind Memory Palace, and how our app helps you apply it digitally.',
};

const TECH_STACK = [
  { label: 'Framework', value: 'Next.js 16 App Router' },
  { label: 'Database', value: 'Supabase (Postgres + RLS)' },
  { label: 'Canvas', value: 'React Flow' },
  { label: 'Styling', value: 'Tailwind CSS + shadcn/ui' },
];

const FEATURES: Array<{ title: string; desc: string }> = [
  {
    title: 'Spatial canvas',
    desc: 'Drag-and-drop nodes on an infinite canvas. Connect them with labelled edges to capture relationships between ideas — not just lists of facts.',
  },
  {
    title: 'Daily review',
    desc: '10 random nodes, 5 minutes, every day. Short enough to be painless; frequent enough to defeat the forgetting curve.',
  },
  {
    title: 'Memory games',
    desc: 'Five game modes — matching, fill-in-the-blank, flashcards, association challenge, and typing practice — make retrieval practice feel like play.',
  },
  {
    title: 'Spaced repetition',
    desc: 'The SM-2 algorithm tracks how well you know each node and schedules reviews at exactly the right intervals.',
  },
];

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-cinematic text-white">
      <CinematicBackground />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <CinematicNav />

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-16 md:px-6 md:pt-40 md:pb-24">
          {}
          <section>
            <p className="mb-4 font-body text-sm text-white/70">{'// The technique'}</p>
            <h1 className="font-heading text-5xl italic leading-[0.9] tracking-[-2px] text-white md:text-6xl lg:text-7xl">
              The Method
              <br />
              of Loci.
            </h1>
            <p className="mt-8 font-body text-base font-light leading-relaxed text-white/85 md:text-lg">
              Used by Greek and Roman orators to memorise hours-long speeches without notes, the
              Method of Loci is the most powerful and well-studied mnemonic technique in history.
              You mentally place the items you want to remember at specific locations along a
              familiar route or inside a familiar building — your memory palace.
            </p>
            <p className="mt-4 font-body text-base font-light leading-relaxed text-white/85 md:text-lg">
              When you need to recall them, you mentally walk the route and pick up the memories
              from where you left them. The spatial encoding leverages the brain&rsquo;s
              extraordinary capacity for place memory — the same system that lets you navigate a
              city after visiting it once.
            </p>
          </section>

          <div aria-hidden="true" className="my-16 h-px bg-white/10" />

          {}
          <section>
            <p className="mb-4 font-body text-sm text-white/70">{'// What it does'}</p>
            <h2 className="font-heading text-4xl italic leading-[0.9] tracking-[-1.5px] text-white md:text-5xl">
              Built for retention.
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {FEATURES.map(({ title, desc }) => (
                <li key={title} className="liquid-glass flex flex-col rounded-[1.25rem] p-5">
                  <h3 className="font-heading text-2xl italic leading-none tracking-[-1px] text-white md:text-3xl">
                    {title}
                  </h3>
                  <p className="mt-3 font-body text-sm font-light leading-snug text-white/85">
                    {desc}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div aria-hidden="true" className="my-16 h-px bg-white/10" />

          {}
          <section>
            <p className="mb-4 font-body text-sm text-white/70">{'// The project'}</p>
            <h2 className="font-heading text-4xl italic leading-[0.9] tracking-[-1.5px] text-white md:text-5xl">
              Open. Spatial. Yours.
            </h2>
            <p className="mt-8 font-body text-base font-light leading-relaxed text-white/85">
              Memory Palace is an open-source project built to explore what a genuinely spatial
              knowledge tool could feel like. The goal is a learning companion that combines the
              rigour of spaced repetition systems like Anki with the visual pleasure of a proper
              node-graph canvas.
            </p>

            <div className="liquid-glass mt-10 overflow-hidden rounded-[1.25rem]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3 text-left font-body text-xs uppercase tracking-wider text-white/60">
                      Layer
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs uppercase tracking-wider text-white/60">
                      Technology
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TECH_STACK.map(({ label, value }, i) => (
                    <tr
                      key={label}
                      className={i < TECH_STACK.length - 1 ? 'border-b border-white/10' : ''}
                    >
                      <td className="px-5 py-3 font-body text-white/70">{label}</td>
                      <td className="px-5 py-3 font-body font-medium text-white">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="liquid-glass inline-flex items-center gap-2 rounded-full px-14 py-5 font-body text-base text-white transition-transform hover:scale-[1.03]"
              >
                <span>Begin Journey</span>
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-body text-sm text-white transition-transform hover:scale-[1.03]"
              >
                View on GitHub
              </a>
            </div>
          </section>
        </main>

        <CinematicFooter />
      </div>
    </div>
  );
}
