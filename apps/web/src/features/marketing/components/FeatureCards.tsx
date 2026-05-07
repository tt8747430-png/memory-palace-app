import { Card, CardHeader, CardTitle, CardDescription } from '@memory-palace/ui';

const FEATURES = [
  {
    icon: '🏛️',
    title: 'Spatial Canvas',
    description:
      'Drag and connect memory nodes on an infinite canvas. See your knowledge as a map, not a list.',
  },
  {
    icon: '📅',
    title: 'Daily Review',
    description:
      'A 5-minute session of 10 random nodes keeps your memory sharp without overwhelming you.',
  },
  {
    icon: '🎮',
    title: 'Memory Games',
    description:
      'Matching, fill-in-the-blank, flashcards — five game modes to make practice actually fun.',
  },
  {
    icon: '📈',
    title: 'Progress Tracking',
    description:
      'Streaks, badges, and spaced repetition scores show you exactly what needs attention.',
  },
];

export function FeatureCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to remember
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built around how human memory actually works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon, title, description }) => (
            <Card
              key={title}
              className="border-border/60 bg-muted/20 transition-colors hover:bg-muted/40"
            >
              <CardHeader>
                <div className="mb-3 text-4xl" role="img" aria-label={title}>
                  {icon}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
