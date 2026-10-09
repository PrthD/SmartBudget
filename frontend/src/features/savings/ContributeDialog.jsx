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
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Money } from '@/components/common/Money';
import { MoneyInput } from '@/components/common/MoneyInput';
import { useContribute } from './api';

/** Mounted fresh on every open (inside DialogContent), so state starts clean. */
function ContributeForm({ goal, suggested, onDone }) {
  const contribute = useContribute();
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState(
    suggested > 0 ? suggested.toFixed(2) : ''
  );

  const value = Number(amount);
  const valid = value > 0 && (mode === 'add' || value <= goal.currentAmount);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!valid) return;
    await contribute.mutateAsync({
      id: goal.id,
      amount: mode === 'add' ? value : -value,
    });
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        onValueChange={(next) => next && setMode(next)}
        className="w-full"
      >
        <ToggleGroupItem value="add" className="flex-1">
          Add money
        </ToggleGroupItem>
        <ToggleGroupItem
          value="withdraw"
          className="flex-1"
          disabled={goal.currentAmount <= 0}
        >
          Withdraw
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="space-y-2">
        <Label htmlFor="contribution">Amount</Label>
        <MoneyInput
          id="contribution"
          autoFocus
          value={amount}
          placeholder="0.00"
          onChange={(event) => setAmount(event.target.value)}
        />
        {mode === 'add' && suggested > 0 && (
          <p className="text-muted-foreground text-xs">
            Prefilled with this goal's share of your plan:{' '}
            <Money value={suggested} />
          </p>
        )}
        {mode === 'withdraw' && value > goal.currentAmount && (
          <p className="text-destructive text-xs">
            You can withdraw at most what's saved.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || contribute.isPending}>
          {contribute.isPending && <Loader2 className="size-4 animate-spin" />}
          {mode === 'add' ? 'Add' : 'Withdraw'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Records money moved into (or out of) a goal — real, persisted progress. */
export function ContributeDialog({ goal, suggested, open, onOpenChange }) {
  if (!goal) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal.title}</DialogTitle>
          <DialogDescription>
            <Money value={goal.currentAmount} /> saved of{' '}
            <Money value={goal.targetAmount} />
          </DialogDescription>
        </DialogHeader>
        <ContributeForm
          goal={goal}
          suggested={suggested}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
