import { cn } from '@/lib/utils';

export function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-8 shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M9 21.5l4.5-5 3.5 3 6-7.5"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="12" r="2.2" className="fill-primary-foreground/70" />
    </svg>
  );
}

export function Logo({ className }) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 font-semibold tracking-tight',
        className
      )}
    >
      <LogoMark />
      <span>SmartBudget</span>
    </span>
  );
}
