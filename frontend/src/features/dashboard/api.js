import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { keys } from '@/lib/queryClient';

/** The dashboard's single round-trip summary (see backend analytics). */
export function useSummary(interval = 'monthly', date) {
  return useQuery({
    queryKey: keys.summary(interval, date),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ interval });
      if (date) params.set('date', date);
      return api.get(`/analytics/summary?${params}`, { signal });
    },
    // Keep showing the old period while the next one loads (no flashing).
    placeholderData: keepPreviousData,
  });
}
