import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/common/DatePicker';
import { LabelCombobox } from '@/components/common/LabelCombobox';
import { MoneyInput } from '@/components/common/MoneyInput';
import { usePreferences } from '@/features/auth/hooks';
import { todayIn, unusualDateHint } from '@/lib/dates';
import { FREQUENCY_LABELS } from '@/lib/format';
import { FREQUENCIES, TRANSACTION_KINDS } from './config';
import { useLabelOptions, useSaveTransaction } from './api';

const schemaFor = (labelName) =>
  z.object({
    label: z
      .string()
      .trim()
      .min(1, `${labelName} is required`)
      .max(60, 'Keep it under 60 characters'),
    amount: z.coerce
      .number({ error: 'Enter an amount' })
      .positive('Amount must be greater than 0')
      .max(1_000_000_000, 'Amount is too large'),
    date: z.string().min(1, 'Pick a date'),
    frequency: z.enum(FREQUENCIES),
    description: z.string().max(500, 'Keep it under 500 characters'),
  });

/**
 * Add or edit an expense/income. `item` = edit; `defaults` = prefill a new
 * entry (e.g. from Smart Add).
 */
export function TransactionFormDialog({
  kind,
  open,
  onOpenChange,
  item,
  defaults,
}) {
  const config = TRANSACTION_KINDS[kind];
  const { timezone } = usePreferences();
  const labelOptions = useLabelOptions(kind);
  const save = useSaveTransaction(kind);
  const isEdit = Boolean(item);

  const form = useForm({
    resolver: zodResolver(schemaFor(config.labelName)),
    defaultValues: emptyValues(timezone),
  });

  useEffect(() => {
    if (!open) return;
    const source = item ?? defaults;
    form.reset(
      source
        ? {
            label: source[config.labelField] ?? source.label ?? '',
            // "38.5" → "38.50" in the money field.
            amount:
              source.amount === null ||
              source.amount === undefined ||
              source.amount === ''
                ? ''
                : Number(source.amount).toFixed(2),
            date: source.date ?? todayIn(timezone),
            frequency: source.frequency ?? 'once',
            description: source.description ?? '',
          }
        : emptyValues(timezone)
    );
  }, [open, item, defaults, config.labelField, timezone, form]);

  // Warn about easy-to-miss dates on one-time entries (an old receipt, a
  // typo in the year). Recurring items legitimately start long ago.
  const [watchedDate, watchedFrequency] = useWatch({
    control: form.control,
    name: ['date', 'frequency'],
  });
  const dateHint =
    watchedFrequency === 'once'
      ? unusualDateHint(watchedDate, todayIn(timezone))
      : null;

  const onSubmit = form.handleSubmit(async ({ label, ...values }) => {
    const payload = { ...values, [config.labelField]: label };
    if (kind === 'expense')
      payload.customCategory = !config.defaultLabels.includes(label);
    await save.mutateAsync({ id: item?.id, values: payload });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${config.singular}` : `Add ${config.singular}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changing the date or frequency resets skipped occurrences.'
              : 'Recurring entries repeat automatically — log them once.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <FormField
              control={form.control}
              name="label"
              render={({ field, fieldState }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{config.labelName}</FormLabel>
                  <FormControl>
                    <LabelCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={labelOptions}
                      placeholder={`Select or create a ${config.labelName.toLowerCase()}`}
                      aria-invalid={Boolean(fieldState.error)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <MoneyInput placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(fieldState.error)}
                    />
                  </FormControl>
                  {dateHint && !fieldState.error && (
                    <p className="text-warning text-xs" role="status">
                      {dateHint}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Repeats</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCIES.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {FREQUENCY_LABELS[frequency]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'once'
                      ? 'A single entry.'
                      : 'Repeats from the date above until you delete it.'}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Note{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Weekly shop at Costco"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Save changes' : `Add ${config.singular}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function emptyValues(timezone) {
  return {
    label: '',
    amount: '',
    date: todayIn(timezone),
    frequency: 'once',
    description: '',
  };
}
