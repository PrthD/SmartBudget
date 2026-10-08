import { useState } from 'react';
import { Goal, MoreHorizontal, Pencil, Target, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Money } from '@/components/common/Money';
import { ProgressMeter } from '@/components/common/ProgressMeter';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { INTERVAL_LABELS, formatDate, formatPercent } from '@/lib/format';
import { TRANSACTION_KINDS } from '@/features/transactions/config';
import { useDeleteTarget, useTarget } from './api';
import { TargetEditorDialog } from './TargetEditorDialog';

const VISIBLE_ITEMS = 5;

/** Budget (expenses) or income goal (income): progress for the current period. */
export function TargetCard({ kind }) {
  const config = TRANSACTION_KINDS[kind];
  const isBudget = kind === 'expense';
  const { data: target, isLoading, error, refetch } = useTarget(kind);
  const remove = useDeleteTarget(kind);
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const editor = (
    <TargetEditorDialog
      kind={kind}
      open={editing}
      onOpenChange={setEditing}
      target={target}
    />
  );

  if (!target) {
    return (
      <>
        <EmptyState
          icon={isBudget ? Target : Goal}
          title={isBudget ? 'No budget yet' : 'No income goal yet'}
          description={
            isBudget
              ? 'Set spending limits per category and see how you are tracking during the period.'
              : 'Set targets per income source to see how close you are each period.'
          }
          action={
            <Button onClick={() => setEditing(true)}>
              Create {config.target.name.toLowerCase()}
            </Button>
          }
          className="h-full"
        />
        {editor}
      </>
    );
  }

  const { progress } = target;
  const elapsedPct = Math.round(progress.elapsed * 100);
  const items = progress.items.filter(
    (item) => item.target > 0 || item.actual > 0
  );
  const visible = showAll ? items : items.slice(0, VISIBLE_ITEMS);
  const overBy = progress.projected - progress.target;
  const status = isBudget
    ? progress.actual > progress.target
      ? { label: 'Over budget', variant: 'destructive' }
      : overBy > 0 && progress.elapsed < 1
        ? { label: 'At risk', variant: 'warning' }
        : { label: 'On track', variant: 'success' }
    : progress.actual >= progress.target
      ? { label: 'Reached', variant: 'success' }
      : {
          label: `${formatPercent(progress.percent)} reached`,
          variant: 'secondary',
        };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.target.name}
          <Badge variant="outline" className="font-normal">
            {INTERVAL_LABELS[target.interval]}
          </Badge>
          <StatusBadge {...status} />
        </CardTitle>
        <CardDescription>
          {formatDate(progress.range.start, 'MMM d')} –{' '}
          {formatDate(progress.range.end, 'MMM d, yyyy')} · {elapsedPct}% of
          period elapsed
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`${config.target.name} actions`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete your ${config.target.name.toLowerCase()}?`,
                    description: 'Your transactions are not affected.',
                    confirmLabel: 'Delete',
                    destructive: true,
                  });
                  if (ok) remove.mutate();
                }}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-semibold tracking-tight">
              <Money value={progress.actual} />
              <span className="text-muted-foreground text-base font-normal">
                {' '}
                / <Money value={progress.target} />
              </span>
            </p>
            <span className="text-muted-foreground text-sm tabular-nums">
              {formatPercent(progress.percent)}
            </span>
          </div>
          <ProgressMeter
            value={progress.percent}
            invert={isBudget}
            marker={elapsedPct}
            label={`${config.target.name} progress`}
          />
          {progress.elapsed < 1 && (
            <p className="text-muted-foreground text-xs">
              Projected by period end:{' '}
              <Money
                value={progress.projected}
                className="text-foreground font-medium"
              />
              {progress.scheduled > 0 && (
                <>
                  {' '}
                  (includes <Money value={progress.scheduled} /> scheduled)
                </>
              )}
            </p>
          )}
        </div>

        <ul className="space-y-3">
          {visible.map((item) => {
            const pct =
              item.target > 0
                ? (item.actual / item.target) * 100
                : item.actual > 0
                  ? 100
                  : 0;
            return (
              <li key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    <Money value={item.actual} />
                    {item.target > 0 ? (
                      <>
                        {' '}
                        / <Money value={item.target} />
                      </>
                    ) : (
                      <span className="ml-1 text-xs">
                        ({isBudget ? 'unbudgeted' : 'no goal'})
                      </span>
                    )}
                  </span>
                </div>
                <ProgressMeter
                  value={pct}
                  invert={isBudget}
                  className="h-1.5"
                  label={item.name}
                />
              </li>
            );
          })}
        </ul>
        {items.length > VISIBLE_ITEMS && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Show less' : `Show all ${items.length}`}
          </Button>
        )}
      </CardContent>
      {editor}
    </Card>
  );
}

function StatusBadge({ label, variant }) {
  const className =
    variant === 'success'
      ? 'bg-success/15 text-success border-transparent'
      : variant === 'warning'
        ? 'bg-warning/15 text-warning border-transparent'
        : undefined;
  return (
    <Badge
      variant={
        variant === 'destructive'
          ? 'destructive'
          : className
            ? 'outline'
            : 'secondary'
      }
      className={className}
    >
      {label}
    </Badge>
  );
}
