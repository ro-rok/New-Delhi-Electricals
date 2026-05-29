import { ShoppingCart } from 'lucide-react';
import { formatInr } from '@/lib/quotationPricing';
import { cn } from '@/lib/utils';

interface CartSummaryBarProps {
  lineCount: number;
  totalUnits: number;
  grandTotal: number;
  className?: string;
}

export function CartSummaryBar({
  lineCount,
  totalUnits,
  grandTotal,
  className,
}: CartSummaryBarProps) {
  const empty = lineCount === 0;

  return (
    <div
      className={cn(
        'shrink-0 border-t px-4 py-3 flex items-center justify-between gap-4',
        empty ? 'bg-muted/50' : 'bg-primary text-primary-foreground',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ShoppingCart className={cn('h-5 w-5 shrink-0', empty && 'text-muted-foreground')} />
        <div className="min-w-0">
          {empty ? (
            <p className="text-sm text-muted-foreground">No items in bill yet</p>
          ) : (
            <>
              <p className="text-lg font-bold leading-tight tabular-nums">
                {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} in bill
              </p>
              <p className={cn('text-sm', empty ? '' : 'opacity-90')}>
                {lineCount} {lineCount === 1 ? 'product' : 'products'} added
              </p>
            </>
          )}
        </div>
      </div>
      {!empty && (
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wide opacity-80">Bill total</p>
          <p className="text-2xl font-bold tabular-nums">{formatInr(grandTotal)}</p>
        </div>
      )}
    </div>
  );
}
