import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is per-user and changes only through this app: cache generously.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      // Client errors (4xx) won't fix themselves; retry only network/5xx once.
      retry: (failureCount, error) =>
        failureCount < 1 &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ),
    },
  },
  // Every mutation reports failures consistently unless it opts out.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.silent) return;
      toast.error(error.message || 'Something went wrong');
    },
  }),
});

/** Query keys in one place so invalidation can't drift. */
export const keys = {
  me: ['me'],
  avatar: (version) => ['avatar', version],
  transactions: (kind) => ['transactions', kind],
  target: (kind) => ['target', kind],
  savingsGoals: ['savings-goals'],
  savingsPlan: ['savings-plan'],
  summary: (interval, date) => ['summary', interval, date ?? 'today'],
  insights: ['insights'],
};

/** Anything that changes money data invalidates every derived view. */
export function invalidateFinancialData() {
  for (const key of [
    ['transactions'],
    ['target'],
    keys.savingsGoals,
    keys.savingsPlan,
    ['summary'],
    keys.insights,
  ]) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
