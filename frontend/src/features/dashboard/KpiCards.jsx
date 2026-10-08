import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Money } from '@/components/common/Money';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

function Delta({ current, previous, goodWhenUp = true, label }) {
  if (!previous)
    return (
      <span className="text-muted-foreground text-xs">
        Nothing to compare yet
      </span>
    );
  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (!Number.isFinite(change) || Math.abs(change) < 0.5) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Minus className="size-3" /> Same as last period
      </span>
    );
  }
  const up = change > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        good ? 'text-success' : 'text-danger'
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(Math.abs(change))}{' '}
      <span className="text-muted-foreground font-normal">{label}</span>
    </span>
  );
}

function Kpi({ label, children, footer }) {
  return (
    <Card className="gap-2 py-5">
      <CardContent className="space-y-1.5">
        <p className="text-muted-foreground text-sm">{label}</p>
        <div className="text-2xl font-semibold tracking-tight">{children}</div>
        <div className="min-h-4">{footer}</div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ current, previous, comparison }) {
  // In-progress periods are compared with the same point of the previous one.
  const label =
    comparison === 'to-date' ? 'vs same point last period' : 'vs last period';
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Income"
        footer={
          <>
            <Delta
              current={current.income}
              previous={previous.income}
              label={label}
            />
            {current.scheduled.income > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                + <Money value={current.scheduled.income} /> scheduled
              </p>
            )}
          </>
        }
      >
        <Money value={current.income} />
      </Kpi>
      <Kpi
        label="Expenses"
        footer={
          <>
            <Delta
              current={current.expense}
              previous={previous.expense}
              goodWhenUp={false}
              label={label}
            />
            {current.scheduled.expense > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                + <Money value={current.scheduled.expense} /> scheduled
              </p>
            )}
          </>
        }
      >
        <Money value={current.expense} />
      </Kpi>
      <Kpi
        label="Net savings"
        footer={
          <Delta current={current.net} previous={previous.net} label={label} />
        }
      >
        <Money value={current.net} tone="auto" />
      </Kpi>
      <Kpi
        label="Savings rate"
        footer={
          <span className="text-muted-foreground text-xs">
            Share of income kept this period
          </span>
        }
      >
        <span className={cn(current.savingsRate < 0 && 'text-expense')}>
          {formatPercent(current.savingsRate)}
        </span>
      </Kpi>
    </div>
  );
}
