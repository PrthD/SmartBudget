import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { TransactionFormDialog } from './TransactionFormDialog';

const SmartAddDialog = lazy(() => import('@/features/ai/SmartAddDialog'));

const QuickActionsContext = createContext(null);

/**
 * Hosts the add/edit and Smart Add dialogs once for the whole app, so any
 * page, the command menu or a keyboard shortcut can open them.
 */
export function QuickActionsProvider({ children }) {
  const [form, setForm] = useState({ open: false, kind: 'expense' });
  const [smartAddOpen, setSmartAddOpen] = useState(false);

  const openTransactionForm = useCallback((kind, { item, defaults } = {}) => {
    setForm({ open: true, kind, item, defaults });
  }, []);
  const openSmartAdd = useCallback(() => setSmartAddOpen(true), []);

  const value = useMemo(
    () => ({ openTransactionForm, openSmartAdd }),
    [openTransactionForm, openSmartAdd]
  );

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      <TransactionFormDialog
        kind={form.kind}
        open={form.open}
        item={form.item}
        defaults={form.defaults}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
      />
      {smartAddOpen && (
        <Suspense fallback={null}>
          <SmartAddDialog
            open={smartAddOpen}
            onOpenChange={setSmartAddOpen}
            onDraftReady={(draft) => {
              setSmartAddOpen(false);
              openTransactionForm(draft.kind, { defaults: draft });
            }}
          />
        </Suspense>
      )}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const context = useContext(QuickActionsContext);
  if (!context)
    throw new Error(
      'useQuickActions must be used inside <QuickActionsProvider>'
    );
  return context;
}
