import type { Metadata } from 'next';
import Link from 'next/link';
import { Separator, buttonVariants, cn } from '@memory-palace/ui';

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

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      {/* Method of Loci explainer */}
      <section>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">The Method of Loci</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Used by Greek and Roman orators to memorise hours-long speeches without notes, the Method
          of Loci is the most powerful and well-studied mnemonic technique in history. You mentally
          place the items you want to remember at specific locations along a familiar route or
          inside a familiar building — your memory palace.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          When you need to recall them, you mentally walk the route and &ldquo;pick up&rdquo; the
          memories from where you left them. The spatial encoding leverages the brain&rsquo;s
          extraordinary capacity for place memory — the same system that lets you navigate a city
          after visiting it once.
        </p>
      </section>

      <Separator className="my-12" />

      {/* Feature overview */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight">What Memory Palace does</h2>
        <ul className="mt-6 space-y-4">
          {[
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
          ].map(({ title, desc }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-1 flex-none text-primary">◆</span>
              <div>
                <strong>{title}</strong>
                <p className="mt-1 text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="my-12" />

      {/* Project background */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight">The project</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Memory Palace is an open-source project built to explore what a genuinely spatial
          knowledge tool could feel like. The goal is a learning companion that combines the rigour
          of spaced repetition systems like Anki with the visual pleasure of a proper node-graph
          canvas.
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium">Layer</th>
                <th className="px-4 py-2.5 text-left font-medium">Technology</th>
              </tr>
            </thead>
            <tbody>
              {TECH_STACK.map(({ label, value }, i) => (
                <tr
                  key={label}
                  className={i < TECH_STACK.length - 1 ? 'border-b border-border/40' : ''}
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                  <td className="px-4 py-2.5 font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/join" className={cn(buttonVariants())}>
            Start for Free
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
