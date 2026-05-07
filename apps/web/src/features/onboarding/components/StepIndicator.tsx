interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div
            key={step}
            className={[
              'h-2 rounded-full transition-all duration-300',
              isActive ? 'w-6 bg-primary' : isDone ? 'w-2 bg-primary/40' : 'w-2 bg-muted',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
