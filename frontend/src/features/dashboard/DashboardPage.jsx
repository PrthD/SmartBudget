import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Plus,
  Sparkles,
} from 'lucide-react';
import { addDays, addMonths, addWeeks, addYears, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Money } from '@/components/common/Money';
import { PageHeader } from '@/components/common/PageHeader';
import { ProgressMeter } from '@/components/common/ProgressMeter';
import { InsightsCard } from '@/features/ai/InsightsCard';
import { useCurrentUser } from '@/features/auth/hooks';
import { useQuickActions } from '@/features/transactions/QuickActions';
import { toCivil } from '@/lib/dates';
import { INTERVAL_LABELS, formatDate, formatPercent } from '@/lib/format';
import { useSummary } from './api';
import { CashflowChart } from './CashflowChart';
import { KpiCards } from './KpiCards';

const STEP = {
  weekly: (date, n) => addWeeks(date, n),
  biweekly: (date, n) => addDays(date, n * 14),
  monthly: (date, n) => addMonths(date, n),
  yearly: (date, n) => addYears(date, n),
};

function periodLabel(interval, range) {
  if (interval === 'monthly') return formatDate(range.start, 'MMMM yyyy');
  if (interval === 'yearly') return formatDate(range.start, 'yyyy');
  return `${formatDate(range.start, 'MMM d')} – ${formatDate(range.end, 'MMM d, yyyy')}`;
}

function TargetProgress({ title, progress, invert, to }) {
  if (!progress) {
    return (
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>No {title.toLowerCase()} set</span>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link to={to}>Create</Link>
        </Button>
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="hover:bg-muted/50 -mx-2 block space-y-2 rounded-md px-2 py-1.5 transition-colors"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {title}{' '}
          <span className="text-muted-foreground font-normal">
            · {INTERVAL_LABELS[progress.interval]}
          </span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          <Money value={progress.actual} /> / <Money value={progress.target} />
        </span>
      </div>
      <ProgressMeter
        value={progress.percent}
        invert={invert}
        marker={progress.elapsed * 100}
        label={title}
      />
    </Link>
  );
}

export function DashboardPage() {
  const user = useCurrentUser();
  const { openTransactionForm, openSmartAdd } = useQuickActions();
  const [interval, setPeriodInterval] = useState('monthly');
  const [date, setDate] = useState();
  const { data, isLoading, error, refetch, isFetching } = useSummary(
    interval,
    date
  );

  const shift = (steps) => {
    const base = parseISO(date ?? data?.today ?? toCivil(new Date()));
    setDate(toCivil(STEP[interval](base, steps)));
  };
  const isCurrent =
    !date ||
    (data &&
      data.current.range.start <= data.today &&
      data.today <= data.current.range.end);
  const hasData =
    data &&
    (data.trend.some((m) => m.income || m.expense) || data.upcoming.length);
  const firstName = user?.name?.split(' ')[0];
  // "Welcome back" only makes sense after the first day.
  // (Uses the server's "today" so rendering stays pure.)
  const isNewAccount = Boolean(
    data?.today && user?.createdAt?.slice(0, 10) >= data.today
  );
  const greeting = isNewAccount ? 'Welcome' : 'Welcome back';

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : 'Dashboard'}
        description="Here's where your money stands."
        actions={
          <>
            <Button variant="outline" onClick={openSmartAdd}>
              <Sparkles className="size-4" /> Smart add
            </Button>
            <Button onClick={() => openTransactionForm('expense')}>
              <Plus className="size-4" /> Add expense
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={interval}
          onValueChange={(value) => {
            setPeriodInterval(value);
            setDate(undefined);
          }}
        >
          <TabsList>
            {Object.entries(INTERVAL_LABELS).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => shift(-1)}
            aria-label="Previous period"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span
            className="min-w-44 text-center text-sm font-medium"
            aria-live="polite"
          >
            {data ? periodLabel(interval, data.current.range) : '…'}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => shift(1)}
            aria-label="Next period"
          >
            <ChevronRight className="size-4" />
          </Button>
          {!isCurrent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDate(undefined)}
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : !hasData ? (
        <EmptyState
          icon={PieChart}
          title="Let's get your dashboard going"
          description="Add your income and a few expenses — recurring ones like rent and salary only need to be entered once."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => openTransactionForm('income')}>
                Add income
              </Button>
              <Button
                variant="outline"
                onClick={() => openTransactionForm('expense')}
              >
                Add expense
              </Button>
            </div>
          }
        />
      ) : (
        <div
          className={
            isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'
          }
        >
          <div className="space-y-4">
            <KpiCards
              current={data.current}
              previous={data.previous}
              comparison={data.comparison}
            />

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Cash flow</CardTitle>
                  <CardDescription>
                    Income and expenses over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CashflowChart trend={data.trend} />
                </CardContent>
              </Card>
              {/* h-0 + min-h-full: fills the row without making it taller, so a
                  long AI report scrolls instead of stretching the chart. */}
              <InsightsCard className="xl:h-0 xl:min-h-full" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by category</CardTitle>
                  <CardDescription>
                    {periodLabel(interval, data.current.range)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.current.byCategory.length ? (
                    <BreakdownDonut
                      items={data.current.byCategory}
                      totalLabel="Spent"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No spending in this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Targets</CardTitle>
                  <CardDescription>
                    Budget and income goal progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TargetProgress
                    title="Budget"
                    progress={data.budget}
                    invert
                    to="/expenses"
                  />
                  <TargetProgress
                    title="Income goal"
                    progress={data.incomeGoal}
                    to="/income"
                  />
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Savings goals</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        asChild
                      >
                        <Link to="/savings">View all</Link>
                      </Button>
                    </div>
                    {data.savings.goals.length ? (
                      data.savings.goals.slice(0, 3).map((goal) => (
                        <div key={goal.id} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="truncate">{goal.title}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {formatPercent(goal.percent)}
                            </span>
                          </div>
                          <ProgressMeter
                            value={goal.percent}
                            className="h-1.5"
                            label={goal.title}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No savings goals yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader>
                  <CardTitle>Upcoming</CardTitle>
                  <CardDescription>
                    Scheduled in the next 30 days
                  </CardDescription>
                  <CardAction>
                    <CalendarClock className="text-muted-foreground size-4" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {data.upcoming.length ? (
                    <ul className="divide-y">
                      {data.upcoming.map((item) => {
                        const Icon =
                          item.kind === 'income'
                            ? ArrowUpRight
                            : ArrowDownRight;
                        return (
                          <li
                            key={`${item.id}-${item.date}`}
                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                          >
                            <div
                              className={
                                item.kind === 'income'
                                  ? 'bg-income/10 text-income rounded-md p-1.5'
                                  : 'bg-expense/10 text-expense rounded-md p-1.5'
                              }
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {item.label}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatDate(item.date, 'EEE, MMM d')}
                              </p>
                            </div>
                            <Money
                              value={
                                item.kind === 'income'
                                  ? item.amount
                                  : -item.amount
                              }
                              sign
                              tone={item.kind}
                              className="text-sm font-medium"
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nothing scheduled. Recurring items will appear here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
