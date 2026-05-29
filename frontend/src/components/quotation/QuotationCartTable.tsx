import { useEffect, useRef } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatInr } from '@/lib/quotationPricing';
import type { QuotationCartItem } from '@/types/quotation';

interface QuotationCartTableProps {
  cart: QuotationCartItem[];
  lastAddedId?: string | null;
  onUpdateItem: (productId: string, patch: Partial<QuotationCartItem>) => void;
  onRemoveItem: (productId: string) => void;
}

export function QuotationCartTable({
  cart,
  lastAddedId,
  onUpdateItem,
  onRemoveItem,
}: QuotationCartTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayCart = [...cart].reverse();

  useEffect(() => {
    if (!lastAddedId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-cart-id="${lastAddedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lastAddedId, cart.length]);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">Bill is empty</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click a product or press Enter to add items
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr className="border-b">
            <th className="text-left font-semibold px-1.5 py-2 w-7">#</th>
            <th className="text-left font-semibold px-1.5 py-2 min-w-[120px]">Product</th>
            <th className="text-right font-semibold px-1 py-2 w-[52px]">LP</th>
            <th className="text-center font-semibold px-1 py-2 w-[44px]" title="Item discount %">
              Disc%
            </th>
            <th className="text-right font-semibold px-1 py-2 w-[56px]">Rate</th>
            <th className="text-center font-semibold px-1 py-2 w-[72px]">Qty</th>
            <th className="text-right font-semibold px-1 py-2 w-[64px]">Amount</th>
            <th className="w-7" />
          </tr>
        </thead>
        <tbody>
          {displayCart.map((item, idx) => {
            const lineNum = cart.length - idx;
            const isNew = item.productId === lastAddedId;
            const hasItemDisc = item.itemDiscountPct > 0;
            const hasOverride = item.manualUnitPrice != null;

            return (
              <tr
                key={item.productId}
                data-cart-id={item.productId}
                className={cn(
                  'border-b align-top transition-colors',
                  isNew && 'bg-green-500/15',
                  !isNew && 'hover:bg-muted/40'
                )}
              >
                <td className="px-1.5 py-2 text-muted-foreground tabular-nums">{lineNum}</td>
                <td className="px-1.5 py-2 min-w-0 max-w-[140px]">
                  <p className="font-mono font-semibold text-foreground leading-tight">{item.sku}</p>
                  <p className="text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                    {item.name}
                  </p>
                  {(item.brand || item.color) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {[item.brand, item.color].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-muted-foreground shrink-0">Net ₹</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="auto"
                      className="h-6 w-full text-[10px] px-1"
                      value={item.manualUnitPrice ?? ''}
                      onChange={(e) =>
                        onUpdateItem(item.productId, {
                          manualUnitPrice: e.target.value ? Number(e.target.value) : null,
                          itemDiscountPct:
                            e.target.value ? 0 : item.itemDiscountPct,
                        })
                      }
                      title="Override unit price (clears item % discount when set)"
                    />
                  </div>
                </td>
                <td className="px-1 py-2 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {formatInr(item.listPrice)}
                </td>
                <td className="px-1 py-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    disabled={hasOverride}
                    className={cn(
                      'h-8 w-full text-center text-xs px-0.5',
                      hasItemDisc && 'border-primary/50 bg-primary/5',
                      hasOverride && 'opacity-50'
                    )}
                    value={item.itemDiscountPct}
                    onChange={(e) =>
                      onUpdateItem(item.productId, {
                        itemDiscountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        manualUnitPrice: null,
                      })
                    }
                    title={hasOverride ? 'Disabled when net price is set' : 'Item discount %'}
                  />
                </td>
                <td className="px-1 py-2 text-right tabular-nums whitespace-nowrap font-medium">
                  {formatInr(item.lineTotals.lineSellingUnit)}
                </td>
                <td className="px-1 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      className="h-8 w-full text-center font-bold text-sm px-1"
                      value={item.quantity}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') return;
                        const v = parseInt(raw, 10);
                        if (!Number.isNaN(v) && v >= 1) {
                          onUpdateItem(item.productId, { quantity: v });
                        }
                      }}
                      onBlur={(e) => {
                        const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                        onUpdateItem(item.productId, { quantity: v });
                      }}
                    />
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          onUpdateItem(item.productId, {
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          onUpdateItem(item.productId, { quantity: item.quantity + 1 })
                        }
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </td>
                <td className="px-1 py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                  {formatInr(item.lineTotals.lineAmount)}
                </td>
                <td className="px-0.5 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(item.productId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
