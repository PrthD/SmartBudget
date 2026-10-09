import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { usePreferences } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

const symbolFor = (currency) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? '$';

/** Number input with the user's currency symbol. Emits strings (form-friendly). */
export const MoneyInput = forwardRef(function MoneyInput(
  { className, ...props },
  ref
) {
  const { currency } = usePreferences();
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        {symbolFor(currency)}
      </span>
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className={cn('pl-8 tabular-nums', className)}
        {...props}
      />
    </div>
  );
});
