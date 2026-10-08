import { useMemo } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Money, useMoneyFormatter } from '@/components/common/Money';
import { formatPercent } from '@/lib/format';

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const MAX_SLICES = 5;

/** Groups the long tail into "Other" so the chart stays readable. */
function toSlices(items) {
  const sorted = [...items]
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const head = sorted.slice(0, MAX_SLICES - 1);
  const tail = sorted.slice(MAX_SLICES - 1);
  const slices =
    tail.length > 1
      ? [
          ...head,
          { name: 'Other', amount: tail.reduce((s, i) => s + i.amount, 0) },
        ]
      : sorted;
  return slices.map((slice, index) => ({
    ...slice,
    fill: PALETTE[index % PALETTE.length],
  }));
}

/** Donut + legend for a { name, amount }[] breakdown. */
export function BreakdownDonut({ items, totalLabel = 'Total' }) {
  const formatMoney = useMoneyFormatter();
  const slices = useMemo(() => toSlices(items), [items]);
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const chartConfig = Object.fromEntries(
    slices.map((slice) => [
      slice.name,
      { label: slice.name, color: slice.fill },
    ])
  );

  return (
    <div className="@container">
      <div className="grid items-center gap-6 @md:grid-cols-[160px_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[180px]">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-full w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) =>
                      `${name}: ${formatMoney(value)}`
                    }
                  />
                }
              />
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                strokeWidth={2}
                paddingAngle={1}
                animationDuration={500}
              >
                {slices.map((slice) => (
                  <Cell
                    key={slice.name}
                    fill={slice.fill}
                    className="stroke-background"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-muted-foreground text-xs">{totalLabel}</span>
            <Money value={total} compact className="text-lg font-semibold" />
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: slice.fill }}
              />
              <span className="flex-1 truncate">{slice.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatPercent((slice.amount / total) * 100)}
              </span>
              <Money
                value={slice.amount}
                className="w-24 text-right font-medium"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
