import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supportedTimeZones } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { CURRENCIES } from './options';

export function CurrencySelect({ value, onChange, id }) {
  const options = CURRENCIES.some(([code]) => code === value)
    ? CURRENCIES
    : [[value, value], ...CURRENCIES];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {code} — {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Searchable list of all IANA time zones. */
export function TimeZoneSelect({ value, onChange, id }) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => supportedTimeZones(), []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value.replaceAll('_', ' ')}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search time zones…" />
          <CommandList>
            <CommandEmpty>No time zone found.</CommandEmpty>
            <CommandGroup>
              {zones.map((zone) => (
                <CommandItem
                  key={zone}
                  value={zone}
                  onSelect={() => {
                    onChange(zone);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      zone === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {zone.replaceAll('_', ' ')}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
