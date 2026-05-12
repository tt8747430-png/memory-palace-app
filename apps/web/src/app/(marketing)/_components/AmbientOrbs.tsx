export function AmbientOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span
        className="ambient-orb absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-gold/20 blur-[100px]"
        style={{ animationDelay: '0s' }}
      />
      <span
        className="ambient-orb absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-cyan/15 blur-[110px]"
        style={{ animationDelay: '-4s' }}
      />
      <span
        className="ambient-orb absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-rose/15 blur-[90px]"
        style={{ animationDelay: '-8s' }}
      />
    </div>
  );
}
