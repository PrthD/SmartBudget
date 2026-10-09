import { useState } from 'react';
import {
  CalendarClock,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Settings2,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Money } from '@/components/common/Money';
import { PageHeader } from '@/components/common/PageHeader';
import { ProgressMeter } from '@/components/common/ProgressMeter';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { INTERVAL_LABELS, formatDate, formatPercent } from '@/lib/format';
import {
  useDeleteGoal,
  useDeletePlan,
  useSavingsGoals,
  useSavingsPlan,
} from './api';
import { ContributeDialog } from './ContributeDialog';
import { GoalFormDialog } from './GoalFormDialog';
import { PlanEditorDialog } from './PlanEditorDialog';

function GoalCard({ goal, allocation, onEdit, onContribute }) {
  const confirm = useConfirm();
  const remove = useDeleteGoal();
  const done = goal.percent >= 100;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="truncate">{goal.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          {goal.deadline ? (
            <>
              <CalendarClock className="size-3.5" />
              {formatDate(goal.deadline)}
            </>
          ) : (
            'No deadline'
          )}
          {goal.overdue && <Badge variant="destructive">Overdue</Badge>}
          {done && (
            <Badge
              className="bg-success/15 text-success border-transparent"
              variant="outline"
            >
              Funded
            </Badge>
          )}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`${goal.title} actions`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete “${goal.title}”?`,
                    description:
                      'Its share of your savings plan is redistributed across the remaining goals.',
                    confirmLabel: 'Delete',
                    destructive: true,
                  });
                  if (ok) remove.mutate(goal);
                }}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-semibold">
            <Money value={goal.currentAmount} />
            <span className="text-muted-foreground text-sm font-normal">
              {' '}
              of <Money value={goal.targetAmount} />
            </span>
          </p>
          <span className="text-muted-foreground text-sm tabular-nums">
            {formatPercent(goal.percent)}
          </span>
        </div>
        <ProgressMeter value={goal.percent} label={`${goal.title} progress`} />
        <div className="text-muted-foreground space-y-1 text-xs">
          {goal.monthlyNeeded > 0 && (
            <p>
              Needs{' '}
              <Money
                value={goal.monthlyNeeded}
                className="text-foreground font-medium"
              />
              /month to hit the deadline
            </p>
          )}
          {allocation && (
            <p>
              Plan share {formatPercent(allocation.ratio * 100, { digits: 1 })}{' '}
              ·{' '}
              <Money
                value={allocation.amount}
                className="text-foreground font-medium"
              />{' '}
              this period
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant={done ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={onContribute}
        >
          <Wallet className="size-4" /> {done ? 'Adjust' : 'Add money'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PlanCard({ plan, goals, onEdit }) {
  const confirm = useConfirm();
  const remove = useDeletePlan();

  if (!plan) {
    return (
      <EmptyState
        icon={Settings2}
        title="No savings plan"
        description="Split your net savings across goals automatically and see each goal's share every period."
        action={
          <Button variant="outline" onClick={onEdit} disabled={!goals.length}>
            Create plan
          </Button>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Savings plan
          <Badge variant="outline" className="font-normal">
            {INTERVAL_LABELS[plan.interval]}
          </Badge>
        </CardTitle>
        <CardDescription>
          Net savings so far this period:{' '}
          <Money value={plan.netSavings} tone="auto" className="font-medium" />
          {plan.netSavings < 0 && ' — nothing to allocate yet.'}
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Delete plan"
            onClick={async () => {
              if (
                await confirm({
                  title: 'Delete savings plan?',
                  confirmLabel: 'Delete',
                  destructive: true,
                })
              ) {
                remove.mutate();
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 overflow-hidden rounded-full">
          {plan.allocations.map((allocation, index) => (
            <div
              key={allocation.goalId}
              style={{
                width: `${allocation.ratio * 100}%`,
                background: `var(--chart-${(index % 5) + 1})`,
              }}
              title={`${allocation.title}: ${formatPercent(allocation.ratio * 100, { digits: 1 })}`}
            />
          ))}
          <div className="bg-muted flex-1" />
        </div>
        <ul className="mt-4 grid gap-x-10 gap-y-2 text-sm xl:grid-cols-2">
          {plan.allocations.map((allocation, index) => (
            <li key={allocation.goalId} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm"
                style={{ background: `var(--chart-${(index % 5) + 1})` }}
              />
              <span className="flex-1 truncate">{allocation.title}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatPercent(allocation.ratio * 100, { digits: 1 })}
              </span>
              <Money
                value={allocation.amount}
                className="w-20 text-right font-medium"
              />
            </li>
          ))}
          {plan.unallocated > 0 && (
            <li className="text-muted-foreground flex items-center gap-2">
              <span className="bg-muted size-2.5 rounded-sm" />
              <span className="flex-1">Unallocated</span>
              <Money value={plan.unallocated} className="w-20 text-right" />
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export function SavingsPage() {
  const goalsQuery = useSavingsGoals();
  const { data: plan } = useSavingsPlan();
  const [formGoal, setFormGoal] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [contributing, setContributing] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);

  const goals = goalsQuery.data ?? [];
  const allocationFor = (goal) =>
    plan?.allocations.find((a) => a.goalId === goal.id);
  const saved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const target = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const openForm = (goal = null) => {
    setFormGoal(goal);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings"
        description="Goals you're saving toward and how your surplus is split between them."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> New goal
          </Button>
        }
      />

      {goalsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : goalsQuery.error ? (
        <ErrorState error={goalsQuery.error} onRetry={goalsQuery.refetch} />
      ) : !goals.length ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create a goal — an emergency fund, a trip, a new laptop — and track every contribution."
          action={
            <Button onClick={() => openForm()}>Create your first goal</Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="justify-center">
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">Total saved</p>
                <p className="text-3xl font-semibold tracking-tight">
                  <Money value={saved} />
                </p>
                <ProgressMeter
                  value={target ? (saved / target) * 100 : 0}
                  label="Total savings progress"
                />
                <p className="text-muted-foreground text-xs">
                  {formatPercent(target ? (saved / target) * 100 : 0)} of{' '}
                  <Money value={target} /> across {goals.length} goal
                  {goals.length === 1 ? '' : 's'}
                </p>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <PlanCard
                plan={plan}
                goals={goals}
                onEdit={() => setPlanOpen(true)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                allocation={allocationFor(goal)}
                onEdit={() => openForm(goal)}
                onContribute={() => setContributing(goal)}
              />
            ))}
          </div>
        </>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={formGoal}
      />
      <ContributeDialog
        goal={contributing}
        suggested={contributing ? allocationFor(contributing)?.amount : 0}
        open={Boolean(contributing)}
        onOpenChange={(open) => !open && setContributing(null)}
      />
      <PlanEditorDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        goals={goals}
        plan={plan}
      />
    </div>
  );
}
