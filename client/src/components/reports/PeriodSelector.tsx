import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { DateRange, TrendPreset } from '../../types/reports';

function getPresetRanges(): { key: TrendPreset; label: string; getRange: () => DateRange }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      key: 'today',
      label: 'Today',
      getRange: () => ({ from: today, to: today, label: 'Today', preset: 'today' }),
    },
    {
      key: 'yesterday',
      label: 'Yesterday',
      getRange: () => {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return { from: d, to: d, label: format(d, 'MMM d, yyyy'), preset: 'yesterday' };
      },
    },
    {
      key: 'this_week',
      label: 'This Week',
      getRange: () => {
        const day = today.getDay();
        const from = new Date(today);
        from.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        return { from, to: today, label: `${format(from, 'MMM d')} – ${format(today, 'MMM d, yyyy')}`, preset: 'this_week' };
      },
    },
    {
      key: 'last_7_days',
      label: 'Last 7 Days',
      getRange: () => {
        const dayOfWeek = today.getDay();
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 13 : dayOfWeek + 6));
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return { from: lastMonday, to: lastSunday, label: `${format(lastMonday, 'MMM d')} – ${format(lastSunday, 'MMM d, yyyy')}`, preset: 'last_7_days' };
      },
    },
    {
      key: 'this_month',
      label: 'This Month',
      getRange: () => {
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from, to: today, label: format(from, 'MMMM yyyy'), preset: 'this_month' };
      },
    },
    {
      key: 'last_month',
      label: 'Last Month',
      getRange: () => {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: lastMonth, to: lastMonthEnd, label: format(lastMonth, 'MMMM yyyy'), preset: 'last_month' };
      },
    },
    {
      key: 'this_year',
      label: 'This Year',
      getRange: () => {
        const from = new Date(today.getFullYear(), 0, 1);
        return { from, to: today, label: `${today.getFullYear()}`, preset: 'this_year' };
      },
    },
  ];
}

function formatDateRange(range: DateRange): string {
  if (range.from.getTime() === range.to.getTime()) {
    return format(range.from, 'MMM d, yyyy');
  }
  return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;
}

interface PeriodSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const presets = useMemo(() => getPresetRanges(), []);

  const handleFromSelect = (date: Date | undefined) => {
    if (date) {
      const newFrom = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange({ ...value, from: newFrom, label: formatDateRange({ ...value, from: newFrom }), preset: 'custom' });
      setFromOpen(false);
    }
  };

  const handleToSelect = (date: Date | undefined) => {
    if (date) {
      const newTo = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange({ ...value, to: newTo, label: formatDateRange({ ...value, to: newTo }), preset: 'custom' });
      setToOpen(false);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {presets.map(preset => (
          <button
            key={preset.key}
            onClick={() => onChange(preset.getRange())}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              value.preset === preset.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-2">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm font-normal min-w-[130px] justify-start"
            >
              <CalendarIcon className="size-3.5 shrink-0" />
              {format(value.from, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value.from}
              onSelect={handleFromSelect}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">to</span>

        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm font-normal min-w-[130px] justify-start"
            >
              <CalendarIcon className="size-3.5 shrink-0" />
              {format(value.to, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value.to}
              onSelect={handleToSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export { PeriodSelector };
