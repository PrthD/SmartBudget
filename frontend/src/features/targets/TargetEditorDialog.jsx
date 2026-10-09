import { useMemo, useState } from 'react';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LabelCombobox } from '@/components/common/LabelCombobox';
import { Money } from '@/components/common/Money';
import { MoneyInput } from '@/components/common/MoneyInput';
import { INTERVAL_LABELS } from '@/lib/format';
import { INTERVALS, TRANSACTION_KINDS } from '@/features/transactions/config';
import { useLabelOptions } from '@/features/transactions/api';
import { fetchSuggestions, useSaveTarget } from './api';

/** Rows of { label, amount (string) } ↔ { [label]: number }. */
const toRows = (amounts = {}) =>
  Object.entries(amounts).map(([label, amount]) => ({
    label,
    amount: String(amount),
  }));

/**
 * Mounted fresh each time the dialog opens, initialised from the saved
 * target. The saved interval is kept (v1 silently reset it to "monthly").
 */
function TargetForm({ kind, target, onDone }) {
  const config = TRANSACTION_KINDS[kind];
  const labelOptions = useLabelOptions(kind);
  const save = useSaveTarget(kind);
  const [interval, setPeriodInterval] = useState(target?.interval ?? 'monthly');
  const [rows, setRows] = useState(() => {
    const initial = toRows(target?.amounts);
    return initial.length
      ? initial
      : labelOptions.slice(0, 4).map((label) => ({ label, amount: '' }));
  });
  const [newLabel, setNewLabel] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );
  const used = new Set(rows.map((row) => row.label.toLowerCase()));
  const available = labelOptions.filter(
    (label) => !used.has(label.toLowerCase())
  );

  const setAmount = (index, amount) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, amount } : row))
    );

  const addRow = (label) => {
    const name = label.trim();
    if (!name || used.has(name.toLowerCase())) return;
    setRows((current) => [...current, { label: name, amount: '' }]);
    setNewLabel('');
  };

  const suggest = async () => {
    setSuggesting(true);
    try {
      const { amounts } = await fetchSuggestions(kind, interval);
      if (!Object.keys(amounts).length) {
        toast.info(
          'Not enough history yet — add a few months of entries first.'
        );
        return;
      }
      setRows((current) => {
        const merged = new Map(current.map((row) => [row.label, row.amount]));
        for (const [label, amount] of Object.entries(amounts))
          merged.set(label, String(amount));
        return [...merged].map(([label, amount]) => ({ label, amount }));
      });
      toast.success('Filled in from your last 3 months — adjust as needed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSuggesting(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const amounts = Object.fromEntries(
      rows
        .filter((row) => Number(row.amount) > 0)
        .map((row) => [row.label, Number(row.amount)])
    );
    if (!Object.keys(amounts).length) {
      toast.error('Set at least one amount greater than 0.');
      return;
    }
    await save.mutateAsync({ interval, amounts });
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="target-interval">Period</Label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={interval} onValueChange={setPeriodInterval}>
            <SelectTrigger id="target-interval" className="w-40">
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
          <Button
            type="button"
            variant="outline"
            onClick={suggest}
            disabled={suggesting}
          >
            {suggesting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Suggest from history
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-72 pr-3">
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.label} className="flex items-center gap-2">
              <Label
                htmlFor={`target-${index}`}
                className="flex-1 truncate font-normal"
              >
                {row.label}
              </Label>
              <div className="w-36">
                <MoneyInput
                  id={`target-${index}`}
                  value={row.amount}
                  placeholder="0.00"
                  onChange={(event) => setAmount(index, event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Remove ${row.label}`}
                onClick={() =>
                  setRows((current) => current.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <div className="flex-1">
          <LabelCombobox
            value={newLabel}
            onChange={addRow}
            options={available}
            placeholder={`Add a ${config.labelName.toLowerCase()}…`}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add row"
          onClick={() => addRow(newLabel)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {INTERVAL_LABELS[interval]} total
        </span>
        <Money value={total} className="font-semibold" />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TargetEditorDialog({ kind, open, onOpenChange, target }) {
  const config = TRANSACTION_KINDS[kind];
  const name = config.target.name.toLowerCase();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {target ? `Edit ${name}` : `Create ${name}`}
          </DialogTitle>
          <DialogDescription>
            Set an amount per {config.labelName.toLowerCase()}. Leave a row
            empty to skip it.
          </DialogDescription>
        </DialogHeader>
        <TargetForm
          kind={kind}
          target={target}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
