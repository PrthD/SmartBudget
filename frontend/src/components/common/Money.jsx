import { usePreferences } from '@/features/auth/hooks';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/** A money amount in the user's currency, with aligned digits. */
export function Money({ value, compact, sign, tone, className }) {
  const { currency } = usePreferences();
  return (
    <span
      className={cn(
        'tabular-nums',
        tone === 'income' && 'text-income',
        tone === 'expense' && 'text-expense',
        tone === 'auto' &&
          (value < 0 ? 'text-expense' : value > 0 ? 'text-income' : ''),
        className
      )}
    >
      {formatMoney(value, currency, { compact, sign })}
    </span>
  );
}

/** Formatting helpers bound to the user's currency, for non-JSX contexts. */
export function useMoneyFormatter() {
  const { currency } = usePreferences();
  return (value, options) => formatMoney(value, currency, options);
}
