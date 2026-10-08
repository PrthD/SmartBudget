import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { invalidateFinancialData, keys, queryClient } from '@/lib/queryClient';
import { TRANSACTION_KINDS } from '@/features/transactions/config';

/** Budget (kind = expense) or income goal (kind = income). */
export function useTarget(kind) {
  const { target } = TRANSACTION_KINDS[kind];
  return useQuery({
    queryKey: keys.target(kind),
    queryFn: ({ signal }) => api.get(target.path, { signal }),
  });
}

export function useSaveTarget(kind) {
  const { target } = TRANSACTION_KINDS[kind];
  return useMutation({
    mutationFn: (values) => api.put(target.path, values),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.target(kind), data);
      toast.success(`${target.name} saved`);
      invalidateFinancialData();
    },
  });
}

export function useDeleteTarget(kind) {
  const { target } = TRANSACTION_KINDS[kind];
  return useMutation({
    mutationFn: () => api.delete(target.path),
    onSuccess: () => {
      queryClient.setQueryData(keys.target(kind), null);
      toast.success(`${target.name} deleted`);
      invalidateFinancialData();
    },
  });
}

export function fetchSuggestions(kind, interval) {
  const { target } = TRANSACTION_KINDS[kind];
  return api.get(`${target.path}/suggestions?interval=${interval}`);
}
