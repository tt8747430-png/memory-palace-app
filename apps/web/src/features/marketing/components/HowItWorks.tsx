const STEPS = [
  {
    number: '01',
    title: 'Create a Palace',
    description:
      'Name your virtual memory palace. Think of a real place you know well — your home, school, or a favourite walk.',
  },
  {
    number: '02',
    title: 'Add Memory Nodes',
    description:
      'Place facts, concepts, and ideas as nodes on your spatial canvas. Connect them with edges to show relationships.',
  },
  {
    number: '03',
    title: 'Review Daily',
    description:
      'A short daily review session reinforces your memories at exactly the right intervals, preventing forgetting.',
  },
  {
    number: '04',
    title: 'Track Progress',
    description:
      'Watch your knowledge graph grow. Streaks, badges, and spaced repetition scores keep you on track.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            From zero to a working memory system in minutes.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ number, title, description }) => (
            <li key={number} className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-primary/20">{number}</span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
