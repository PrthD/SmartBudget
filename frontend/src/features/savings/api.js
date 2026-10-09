import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { invalidateFinancialData, keys, queryClient } from '@/lib/queryClient';

export function useSavingsGoals() {
  return useQuery({
    queryKey: keys.savingsGoals,
    queryFn: ({ signal }) => api.get('/savings-goals', { signal }),
  });
}

export function useSavingsPlan() {
  return useQuery({
    queryKey: keys.savingsPlan,
    queryFn: ({ signal }) => api.get('/savings-plan', { signal }),
  });
}

const upsertGoal = (goal) =>
  queryClient.setQueryData(keys.savingsGoals, (goals = []) =>
    goals.some((g) => g.id === goal.id)
      ? goals.map((g) => (g.id === goal.id ? goal : g))
      : [...goals, goal]
  );

export function useSaveGoal() {
  return useMutation({
    mutationFn: ({ id, values }) =>
      id
        ? api.patch(`/savings-goals/${id}`, values)
        : api.post('/savings-goals', values),
    onSuccess: (goal, { id }) => {
      upsertGoal(goal);
      toast.success(id ? 'Goal updated' : 'Goal created');
      invalidateFinancialData();
    },
  });
}

export function useDeleteGoal() {
  return useMutation({
    mutationFn: (goal) => api.delete(`/savings-goals/${goal.id}`),
    onSuccess: (_data, goal) => {
      queryClient.setQueryData(keys.savingsGoals, (goals = []) =>
        goals.filter((g) => g.id !== goal.id)
      );
      toast.success(`“${goal.title}” deleted`);
      invalidateFinancialData();
    },
  });
}

export function useContribute() {
  return useMutation({
    mutationFn: ({ id, amount }) =>
      api.post(`/savings-goals/${id}/contributions`, { amount }),
    onSuccess: (goal, { amount }) => {
      upsertGoal(goal);
      toast.success(
        amount > 0
          ? `Added to “${goal.title}”`
          : `Withdrawn from “${goal.title}”`
      );
      if (goal.percent >= 100 && amount > 0)
        toast.success(`🎉 “${goal.title}” is fully funded!`);
      invalidateFinancialData();
    },
  });
}

export function useSavePlan() {
  return useMutation({
    mutationFn: (values) => api.put('/savings-plan', values),
    onSuccess: (plan) => {
      queryClient.setQueryData(keys.savingsPlan, plan);
      toast.success('Savings plan saved');
    },
  });
}

export function useDeletePlan() {
  return useMutation({
    mutationFn: () => api.delete('/savings-plan'),
    onSuccess: () => {
      queryClient.setQueryData(keys.savingsPlan, null);
      toast.success('Savings plan deleted');
    },
  });
}
