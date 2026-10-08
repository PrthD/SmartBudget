import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router';
import { capitalize, formatDate } from '@/lib/format';
import { invalidateFinancialData, keys, queryClient } from '@/lib/queryClient';
import { TRANSACTION_KINDS } from './config';

export function useTransactions(kind) {
  const { path } = TRANSACTION_KINDS[kind];
  return useQuery({
    queryKey: keys.transactions(kind),
    queryFn: ({ signal }) => api.get(path, { signal }),
  });
}

/** Distinct labels in use, most-used first, plus sensible defaults. */
export function useLabelOptions(kind) {
  const config = TRANSACTION_KINDS[kind];
  const { data = [] } = useTransactions(kind);
  const counts = new Map();
  for (const item of data) {
    counts.set(
      item[config.labelField],
      (counts.get(item[config.labelField]) ?? 0) + 1
    );
  }
  const used = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
  const lower = new Set(used.map((label) => label.toLowerCase()));
  return [
    ...used,
    ...config.defaultLabels.filter((label) => !lower.has(label.toLowerCase())),
  ];
}

const replaceInList = (kind, item) =>
  queryClient.setQueryData(keys.transactions(kind), (list) =>
    list?.map((existing) => (existing.id === item.id ? item : existing))
  );

export function useSaveTransaction(kind) {
  const { path, route, singular, labelField } = TRANSACTION_KINDS[kind];
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, values }) =>
      id ? api.patch(`${path}/${id}`, values) : api.post(path, values),
    onSuccess: (item, { id }) => {
      if (id) replaceInList(kind, item);
      // Say where it was filed and offer a jump to it: an entry dated in
      // another month (e.g. an old receipt) sorts far from the top.
      toast.success(
        id
          ? `${capitalize(singular)} updated`
          : `${capitalize(singular)} added`,
        {
          description: `${item[labelField]} · ${formatDate(item.date)}`,
          action: {
            label: 'View',
            onClick: () =>
              navigate(
                `${route}?${new URLSearchParams({ q: `${item.date} ${item[labelField]}` })}`
              ),
          },
        }
      );
      invalidateFinancialData();
    },
  });
}

/** Optimistic delete with an "Undo" that re-creates the item. */
export function useDeleteTransactions(kind) {
  const { path, labelField, singular } = TRANSACTION_KINDS[kind];
  const key = keys.transactions(kind);

  return useMutation({
    mutationFn: (items) =>
      Promise.all(items.map((item) => api.delete(`${path}/${item.id}`))),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      const ids = new Set(items.map((item) => item.id));
      queryClient.setQueryData(key, (list) =>
        list?.filter((item) => !ids.has(item.id))
      );
      return { previous };
    },
    onError: (_error, _items, context) =>
      queryClient.setQueryData(key, context.previous),
    onSuccess: (_data, items) => {
      invalidateFinancialData();
      toast.success(
        items.length === 1
          ? `${capitalize(singular)} deleted`
          : `${items.length} items deleted`,
        {
          action: {
            label: 'Undo',
            onClick: async () => {
              await Promise.all(
                items.map((item) =>
                  api.post(path, {
                    [labelField]: item[labelField],
                    amount: item.amount,
                    date: item.date,
                    description: item.description,
                    frequency: item.frequency,
                    ...(item.customCategory !== undefined
                      ? { customCategory: item.customCategory }
                      : {}),
                  })
                )
              );
              invalidateFinancialData();
            },
          },
        }
      );
    },
  });
}

export function useSkipOccurrence(kind) {
  const { path } = TRANSACTION_KINDS[kind];
  return useMutation({
    mutationFn: ({ id, date, restore }) =>
      restore
        ? api.delete(`${path}/${id}/skips/${date}`)
        : api.post(`${path}/${id}/skips`, { date }),
    onSuccess: (item, { restore }) => {
      replaceInList(kind, item);
      toast.success(
        restore ? 'Occurrence restored' : 'Next occurrence skipped'
      );
      invalidateFinancialData();
    },
  });
}

export function useRenameLabel(kind) {
  const { path, labelName } = TRANSACTION_KINDS[kind];
  return useMutation({
    mutationFn: ({ from, to }) =>
      api.post(`${path}/labels/rename`, { from, to }),
    onSuccess: ({ updated }, { to }) => {
      toast.success(`${labelName} renamed to “${to}” (${updated} items)`);
      invalidateFinancialData();
    },
  });
}
