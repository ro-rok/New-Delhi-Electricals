import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRangePreset } from '@/api/analytics';

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
  startDate?: Date;
  endDate?: Date;
  onCustomRangeChange?: (start: Date, end: Date) => void;
}

export function DateRangePicker({
  value,
  onChange,
  startDate,
  endDate,
  onCustomRangeChange,
}: DateRangePickerProps) {
  const [customStart, setCustomStart] = useState<Date | undefined>(startDate);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endDate);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (startDate) setCustomStart(startDate); }, [startDate]);
  useEffect(() => { if (endDate) setCustomEnd(endDate); }, [endDate]);

  const handlePreset = (preset: string) => {
    onChange(preset as DateRangePreset);
    if (preset !== 'custom') setOpen(false);
  };

  const applyCustom = () => {
    if (customStart && customEnd && onCustomRangeChange) {
      onCustomRangeChange(customStart, customEnd);
      onChange('custom');
      setOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={handlePreset}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="14d">Last 14 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 font-normal">
              <CalendarIcon className="h-4 w-4" />
              {customStart && customEnd
                ? `${format(customStart, 'MMM d')} – ${format(customEnd, 'MMM d')}`
                : 'Pick dates'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 space-y-4" align="start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start</p>
              <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End</p>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
                disabled={(d) => (customStart ? d < customStart : false)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!customStart || !customEnd}
              onClick={applyCustom}
            >
              Apply
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
