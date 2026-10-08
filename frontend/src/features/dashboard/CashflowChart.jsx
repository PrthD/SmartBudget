import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMoneyFormatter } from '@/components/common/Money';
import { formatDate } from '@/lib/format';

const config = {
  income: { label: 'Income', color: 'var(--income)' },
  expense: { label: 'Expenses', color: 'var(--expense)' },
  net: { label: 'Net', color: 'var(--chart-2)' },
};

/** Income vs expenses per month, with net savings as a line. */
export function CashflowChart({ trend }) {
  const formatMoney = useMoneyFormatter();
  if (!trend.some((point) => point.income || point.expense)) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        No income or expenses in these 12 months.
      </div>
    );
  }
  const data = trend.map((point) => ({
    ...point,
    label: formatDate(`${point.month}-01`, 'MMM'),
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value) => formatMoney(value, { compact: true })}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) =>
                formatDate(`${payload?.[0]?.payload.month}-01`, 'MMMM yyyy')
              }
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name]?.label}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(value)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
