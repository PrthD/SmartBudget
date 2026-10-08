import { PieChart as PieIcon, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { TargetCard } from '@/features/targets/TargetCard';
import { useSummary } from '@/features/dashboard/api';
import { formatDate } from '@/lib/format';
import { TRANSACTION_KINDS } from './config';
import { useTransactions } from './api';
import { TransactionTable } from './TransactionTable';
import { useQuickActions } from './QuickActions';

function MonthBreakdown({ kind }) {
  const { data, isLoading } = useSummary('monthly');
  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  const items =
    kind === 'expense' ? data?.current.byCategory : data?.current.bySource;
  const { labelName } = TRANSACTION_KINDS[kind];

  return (
    <Card>
      <CardHeader>
        <CardTitle>This month by {labelName.toLowerCase()}</CardTitle>
        {data && (
          <CardDescription>
            {formatDate(data.current.range.start, 'MMMM yyyy')} · up to today
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {items?.length ? (
          <BreakdownDonut
            items={items}
            totalLabel={kind === 'expense' ? 'Spent' : 'Earned'}
          />
        ) : (
          <EmptyState
            icon={PieIcon}
            title="Nothing this month yet"
            className="border-none py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

/** Shared page for expenses and income (driven by TRANSACTION_KINDS). */
export function TransactionsPage({ kind }) {
  const config = TRANSACTION_KINDS[kind];
  const { data = [], isLoading, error, refetch } = useTransactions(kind);
  const { openTransactionForm, openSmartAdd } = useQuickActions();

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button variant="outline" onClick={openSmartAdd}>
              <Sparkles className="size-4" /> Smart add
            </Button>
            <Button onClick={() => openTransactionForm(kind)}>
              <Plus className="size-4" /> Add {config.singular}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TargetCard kind={kind} />
        <MonthBreakdown kind={kind} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <TransactionTable kind={kind} items={data} isLoading={isLoading} />
      )}
    </div>
  );
}

export const ExpensesPage = () => <TransactionsPage kind="expense" />;
export const IncomePage = () => <TransactionsPage kind="income" />;
