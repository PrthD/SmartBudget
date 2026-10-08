import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/common/DatePicker';
import { MoneyInput } from '@/components/common/MoneyInput';
import { usePreferences } from '@/features/auth/hooks';
import { todayIn } from '@/lib/dates';
import { useSaveGoal } from './api';

const GoalSchema = z.object({
  title: z.string().trim().min(1, 'Give your goal a name').max(60),
  targetAmount: z.coerce
    .number({ error: 'Enter a target' })
    .positive('Target must be greater than 0'),
  currentAmount: z.coerce.number().min(0, 'Cannot be negative'),
  deadline: z.string().nullable(),
  description: z.string().max(500),
});

const EMPTY = {
  title: '',
  targetAmount: '',
  currentAmount: '0',
  deadline: null,
  description: '',
};

export function GoalFormDialog({ open, onOpenChange, goal }) {
  const { timezone } = usePreferences();
  const save = useSaveGoal();
  const form = useForm({
    resolver: zodResolver(GoalSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      goal
        ? {
            title: goal.title,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            deadline: goal.deadline,
            description: goal.description,
          }
        : EMPTY
    );
  }, [open, goal, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await save.mutateAsync({ id: goal?.id, values });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit goal' : 'New savings goal'}</DialogTitle>
          <DialogDescription>
            Track progress toward something you're saving for.
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
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Emergency fund"
                      maxLength={60}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <MoneyInput placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saved so far</FormLabel>
                  <FormControl>
                    <MoneyInput placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Target date{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      clearable
                      fromDate={todayIn(timezone)}
                      placeholder="No deadline"
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Textarea rows={2} {...field} />
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
                {goal ? 'Save changes' : 'Create goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
