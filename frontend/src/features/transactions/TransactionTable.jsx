import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Repeat,
  Search,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Money } from '@/components/common/Money';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { downloadFile, toCsv } from '@/lib/csv';
import { FREQUENCY_LABELS, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TRANSACTION_KINDS } from './config';
import { useDeleteTransactions, useSkipOccurrence } from './api';
import { filterTransactions, PERIOD_OPTIONS } from './filters';
import { useTableState } from './useTableState';
import { useQuickActions } from './QuickActions';

const PAGE_SIZE = 15;

// Columns that give way on small screens (header and cells share these).
const COLUMN_CLASSES = {
  select: 'hidden w-10 sm:table-cell',
  description: 'hidden md:table-cell',
  frequency: 'hidden md:table-cell',
  actions: 'w-12',
};

function SortHeader({ column, children, className }) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-2 h-8 px-2 font-medium', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      <Icon className={cn('size-3.5', !sorted && 'opacity-40')} />
    </Button>
  );
}

function RowActions({ item, kind, onDelete }) {
  const { openTransactionForm } = useQuickActions();
  const skip = useSkipOccurrence(kind);
  const lastSkipped = item.skippedDates.at(-1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Row actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => openTransactionForm(kind, { item })}>
          <Pencil /> Edit
        </DropdownMenuItem>
        {item.nextOccurrence && (
          <DropdownMenuItem
            onClick={() =>
              skip.mutate({ id: item.id, date: item.nextOccurrence })
            }
          >
            <CalendarX2 /> Skip {formatDate(item.nextOccurrence, 'MMM d')}
          </DropdownMenuItem>
        )}
        {lastSkipped && (
          <DropdownMenuItem
            onClick={() =>
              skip.mutate({ id: item.id, date: lastSkipped, restore: true })
            }
          >
            <Undo2 /> Restore {formatDate(lastSkipped, 'MMM d')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete([item])}
        >
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TransactionTable({ kind, items, isLoading }) {
  const config = TRANSACTION_KINDS[kind];
  const { labelField } = config;
  const [state, update] = useTableState();
  const [rowSelection, setRowSelection] = useState({});
  const confirm = useConfirm();
  const remove = useDeleteTransactions(kind);

  // The URL is the source of truth for the search; the input keeps a local
  // copy so typing feels instant. Changes from outside (links such as
  // "View" after saving, back/forward) flow into the input…
  const [search, setSearch] = useState(state.q);
  const [syncedQ, setSyncedQ] = useState(state.q);
  if (state.q !== syncedQ) {
    setSyncedQ(state.q);
    setSearch(state.q);
  }
  const deferredSearch = useDeferredValue(search);
  // …and typing reaches the URL after a short pause.
  const searchTimer = useRef(null);
  const onSearchChange = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSyncedQ(value);
      update({ q: value });
    }, 250);
  };
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const labels = useMemo(
    () => [...new Set(items.map((item) => item[labelField]))].sort(),
    [items, labelField]
  );
  const filtered = useMemo(
    () =>
      filterTransactions(items, { ...state, q: deferredSearch }, labelField),
    [items, state, deferredSearch, labelField]
  );

  const { mutate: removeRows } = remove;
  const onDelete = useCallback(
    async (rows) => {
      const ok = await confirm({
        title:
          rows.length > 1
            ? `Delete ${rows.length} items?`
            : `Delete this ${config.singular}?`,
        description: rows.some((row) => row.frequency !== 'once')
          ? 'Recurring items stop repeating and disappear from past totals. You can undo right after.'
          : 'You can undo right after deleting.',
        confirmLabel: 'Delete',
        destructive: true,
      });
      if (!ok) return;
      removeRows(rows);
      setRowSelection({});
    },
    [confirm, removeRows, config.singular]
  );

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Select all on page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'date',
        header: ({ column }) => <SortHeader column={column}>Date</SortHeader>,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{formatDate(getValue())}</span>
        ),
        sortingFn: (a, b) =>
          a.original.date < b.original.date
            ? -1
            : a.original.date > b.original.date
              ? 1
              : 0,
      },
      {
        accessorKey: labelField,
        header: ({ column }) => (
          <SortHeader column={column}>{config.labelName}</SortHeader>
        ),
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="max-w-40 truncate font-normal">
            {getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Note',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground line-clamp-1 max-w-64">
            {getValue() || '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'frequency',
        header: 'Repeats',
        cell: ({ row }) =>
          row.original.frequency === 'once' ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5">
                <Repeat className="text-muted-foreground size-3.5" />
                {FREQUENCY_LABELS[row.original.frequency]}
              </span>
              {row.original.nextOccurrence && (
                <span className="text-muted-foreground text-xs">
                  Next {formatDate(row.original.nextOccurrence, 'MMM d')}
                </span>
              )}
            </div>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <div className="text-right">
            <SortHeader column={column} className="mr-[-0.5rem] ml-auto">
              Amount
            </SortHeader>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-medium">
            <Money value={getValue()} tone={config.tone} />
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <RowActions item={row.original} kind={kind} onDelete={onDelete} />
        ),
        enableSorting: false,
      },
    ],
    [kind, labelField, config.labelName, config.tone, onDelete]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting: state.sorting,
      pagination: { pageIndex: state.pageIndex, pageSize: PAGE_SIZE },
      rowSelection,
    },
    onSortingChange: (updater) => {
      const [next] =
        typeof updater === 'function' ? updater(state.sorting) : updater;
      update({
        sort: next ? `${next.id}:${next.desc ? 'desc' : 'asc'}` : undefined,
      });
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: state.pageIndex, pageSize: PAGE_SIZE })
          : updater;
      update({ page: String(next.pageIndex + 1) }, { resetPage: false });
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const hasFilters =
    state.q ||
    state.label !== 'all' ||
    state.type !== 'all' ||
    state.period !== 'all';

  const exportCsv = () => {
    const rows = table.getSortedRowModel().rows.map((row) => row.original);
    const csv = toCsv(
      [
        { header: 'Date', value: (r) => r.date },
        { header: config.labelName, value: (r) => r[labelField] },
        { header: 'Amount', value: (r) => r.amount.toFixed(2) },
        { header: 'Repeats', value: (r) => FREQUENCY_LABELS[r.frequency] },
        { header: 'Next occurrence', value: (r) => r.nextOccurrence ?? '' },
        { header: 'Note', value: (r) => r.description },
      ],
      rows
    );
    downloadFile(`smartbudget-${config.path.slice(1)}.csv`, csv);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}…`}
            className="pl-8"
            aria-label="Search"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            value={state.label}
            onValueChange={(label) => update({ label })}
          >
            <SelectTrigger className="sm:w-40" aria-label={config.labelName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {config.labelPlural}</SelectItem>
              {labels.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={state.type} onValueChange={(type) => update({ type })}>
            <SelectTrigger className="sm:w-36" aria-label="Type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="once">One-time</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={state.period}
            onValueChange={(period) => update({ period })}
          >
            <SelectTrigger className="sm:w-36" aria-label="Period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      {(selected.length > 0 || hasFilters) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {selected.length > 0 && (
            <>
              <span className="text-muted-foreground">
                {selected.length} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(selected)}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </>
          )}
          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearTimeout(searchTimer.current);
                setSearch('');
                update({ q: '', label: 'all', type: 'all', period: 'all' });
              }}
            >
              <X className="size-3.5" /> Clear filters
            </Button>
          )}
        </div>
      )}

      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={COLUMN_CLASSES[header.id]}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={COLUMN_CLASSES[cell.column.id]}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-28 text-center"
                >
                  {items.length
                    ? 'No results match your filters.'
                    : `No ${config.title.toLowerCase()} yet.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filtered.length} items · Page {state.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
