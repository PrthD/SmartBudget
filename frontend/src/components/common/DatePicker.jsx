import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { fromCivil, toCivil } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Date picker that speaks `YYYY-MM-DD` strings (the API's date format). */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  clearable = false,
  disabled,
  fromDate,
  id,
  'aria-invalid': invalid,
}) {
  const [open, setOpen] = useState(false);
  const selected = fromCivil(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              'w-full justify-start font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="size-4" />
            {value ? formatDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        {clearable && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => onChange(null)}
            aria-label="Clear date"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          disabled={fromDate ? { before: fromCivil(fromDate) } : undefined}
          onSelect={(date) => {
            if (date) onChange(toCivil(date));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
