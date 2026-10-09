import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Pick an existing category/source or type a new one. Suggestions are merged
 * with labels the user already uses, case-insensitively.
 */
export function LabelCombobox({
  value,
  onChange,
  options,
  placeholder,
  id,
  'aria-invalid': invalid,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const trimmed = search.trim();
  const exists = options.some(
    (option) => option.toLowerCase() === trimmed.toLowerCase()
  );

  const select = (label) => {
    onChange(label);
    setSearch('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search or create…"
            value={search}
            onValueChange={setSearch}
            maxLength={60}
          />
          <CommandList>
            <CommandEmpty>
              {trimmed ? null : 'Start typing to create one.'}
            </CommandEmpty>
            {trimmed && !exists && (
              <CommandGroup>
                <CommandItem
                  value={`create:${trimmed}`}
                  onSelect={() => select(trimmed)}
                >
                  <Plus className="size-4" />
                  Create “{trimmed}”
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => select(option)}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === option ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
