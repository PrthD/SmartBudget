import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

const DEFAULTS = {
  q: '',
  label: 'all',
  type: 'all',
  period: 'all',
  sort: 'date:desc',
  page: '1',
};

/**
 * Table filters/sort/page live in the URL: they survive data refreshes (a v1
 * bug reset them on every change), reloads and can be shared as links.
 */
export function useTableState() {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const read = (key) => params.get(key) ?? DEFAULTS[key];
    const [sortId, sortDir] = read('sort').split(':');
    return {
      q: read('q'),
      label: read('label'),
      type: read('type'),
      period: read('period'),
      sorting: [{ id: sortId, desc: sortDir !== 'asc' }],
      pageIndex: Math.max(0, Number.parseInt(read('page'), 10) - 1 || 0),
    };
  }, [params]);

  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === DEFAULTS[key])
              next.delete(key);
            else next.set(key, value);
          }
          if (resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  return [state, update];
}
