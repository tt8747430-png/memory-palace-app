const STATS = [
  { value: '10,000+', label: 'nodes created' },
  { value: '500+', label: 'palaces built' },
  { value: '30%', label: 'better recall' },
];

export function StatsBar() {
  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <dt className="text-4xl font-bold tracking-tight">{value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
