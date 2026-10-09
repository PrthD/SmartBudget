import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressMeter } from '@/components/common/ProgressMeter';
import { INTERVAL_LABELS } from '@/lib/format';
import { INTERVALS } from '@/features/transactions/config';
import { useSavePlan } from './api';

function initialPercents(goals, plan) {
  if (!plan) {
    // No plan yet: start with an even split.
    const even = goals.length ? Math.floor(100 / goals.length) : 0;
    return Object.fromEntries(goals.map((goal) => [goal.id, String(even)]));
  }
  const byId = Object.fromEntries(
    plan.allocations.map((a) => [a.goalId, a.ratio])
  );
  return Object.fromEntries(
    goals.map((goal) => [
      goal.id,
      String(Math.round((byId[goal.id] ?? 0) * 1000) / 10),
    ])
  );
}

function PlanForm({ goals, plan, onDone }) {
  const save = useSavePlan();
  const [interval, setPeriodInterval] = useState(plan?.interval ?? 'monthly');
  const [percents, setPercents] = useState(() => initialPercents(goals, plan));

  const total = Object.values(percents).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
  const overAllocated = total > 100.0001;

  const onSubmit = async (event) => {
    event.preventDefault();
    const ratios = Object.fromEntries(
      Object.entries(percents)
        .filter(([, value]) => Number(value) > 0)
        .map(([id, value]) => [id, Number(value) / 100])
    );
    await save.mutateAsync({ interval, ratios });
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="plan-interval">Period</Label>
        <Select value={interval} onValueChange={setPeriodInterval}>
          <SelectTrigger id="plan-interval" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((value) => (
              <SelectItem key={value} value={value}>
                {INTERVAL_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3">
            <Label
              htmlFor={`plan-${goal.id}`}
              className="flex-1 truncate font-normal"
            >
              {goal.title}
            </Label>
            <div className="relative w-28">
              <Input
                id={`plan-${goal.id}`}
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                className="pr-7 tabular-nums"
                value={percents[goal.id] ?? ''}
                onChange={(event) =>
                  setPercents((current) => ({
                    ...current,
                    [goal.id]: event.target.value,
                  }))
                }
              />
              <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                %
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Allocated</span>
          <span
            className={
              overAllocated ? 'text-destructive font-medium' : 'font-medium'
            }
          >
            {total.toFixed(1)}%
          </span>
        </div>
        <ProgressMeter value={total} invert label="Allocated share" />
        <p className="text-muted-foreground text-xs">
          {overAllocated
            ? 'Shares cannot add up to more than 100%.'
            : total < 100
              ? `${(100 - total).toFixed(1)}% stays unallocated.`
              : 'All net savings are allocated.'}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={overAllocated || total <= 0 || save.isPending}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save plan
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Split each period's net savings across goals by percentage. */
export function PlanEditorDialog({ open, onOpenChange, goals, plan }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Savings plan</DialogTitle>
          <DialogDescription>
            Decide how each period's net savings (income − expenses) should be
            split between your goals.
          </DialogDescription>
        </DialogHeader>
        <PlanForm
          goals={goals}
          plan={plan}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
