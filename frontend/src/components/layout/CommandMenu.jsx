import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Laptop,
  Moon,
  PiggyBank,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useQuickActions } from '@/features/transactions/QuickActions';
import { NAV_ITEMS, SECONDARY_NAV } from './nav';

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform);

/** ⌘K / Ctrl+K palette for navigation and quick actions. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { openTransactionForm, openSmartAdd } = useQuickActions();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const run = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground hidden h-8 w-56 justify-start gap-2 font-normal md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search or jump to…
        <kbd className="bg-muted ml-auto rounded px-1.5 font-mono text-[10px]">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command menu"
        description="Navigate or run an action"
      >
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={run(() => openTransactionForm('expense'))}>
              <ArrowDownRight /> Add expense
            </CommandItem>
            <CommandItem onSelect={run(() => openTransactionForm('income'))}>
              <ArrowUpRight /> Add income
            </CommandItem>
            <CommandItem onSelect={run(openSmartAdd)}>
              <Sparkles /> Smart add
              <CommandShortcut>AI</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={run(() => navigate('/savings'))}>
              <PiggyBank /> New savings goal
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {[...NAV_ITEMS, ...SECONDARY_NAV].map(
              ({ to, label, icon: Icon }) => (
                <CommandItem key={to} onSelect={run(() => navigate(to))}>
                  <Icon /> {label}
                </CommandItem>
              )
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={run(() => setTheme('light'))}>
              <Sun /> Light
            </CommandItem>
            <CommandItem onSelect={run(() => setTheme('dark'))}>
              <Moon /> Dark
            </CommandItem>
            <CommandItem onSelect={run(() => setTheme('system'))}>
              <Laptop /> System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
