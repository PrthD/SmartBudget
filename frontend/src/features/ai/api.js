import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { keys, queryClient } from '@/lib/queryClient';

export function useInsights() {
  return useQuery({
    queryKey: keys.insights,
    queryFn: ({ signal }) => api.get('/ai/insights', { signal }),
    // Reports are cached server-side for a day; no need to refetch often.
    staleTime: 10 * 60_000,
  });
}

export function useRefreshInsights() {
  return useMutation({
    mutationFn: () => api.get('/ai/insights?refresh=true'),
    onSuccess: (data) => queryClient.setQueryData(keys.insights, data),
  });
}

export function useParseTransaction() {
  return useMutation({
    mutationFn: ({ text, image }) =>
      api.post('/ai/parse', { text: text || undefined, image }),
  });
}

/** Whether the server has AI configured and the user has opted in. */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: ({ signal }) => api.get('/ai/status', { signal }),
    staleTime: 10 * 60_000,
  });
}
