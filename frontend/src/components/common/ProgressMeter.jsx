import { cn } from '@/lib/utils';

/**
 * Progress bar whose colour reflects status. For budgets, higher is worse
 * (`invert`); for goals, higher is better. An optional marker shows where
 * you "should" be (e.g. % of the period elapsed).
 */
export function ProgressMeter({
  value,
  invert = false,
  marker,
  className,
  label,
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  // Budgets: exactly 100% means "fully used", not overspent.
  const tone = invert
    ? value > 100
      ? 'bg-danger'
      : value >= 85
        ? 'bg-warning'
        : 'bg-primary'
    : value >= 100
      ? 'bg-success'
      : 'bg-primary';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value ?? 0)}
      className={cn(
        'bg-muted relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          tone
        )}
        style={{ width: `${pct}%` }}
      />
      {marker !== undefined && marker > 0 && marker < 100 && (
        <div
          className="bg-foreground/40 absolute inset-y-0 w-0.5"
          style={{ left: `${marker}%` }}
          title="Where you'd be at an even pace"
        />
      )}
    </div>
  );
}
