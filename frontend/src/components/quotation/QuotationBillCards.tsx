import { useEffect, useRef } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatInr } from '@/lib/quotationPricing';
import type { QuotationCartItem } from '@/types/quotation';

interface QuotationBillCardsProps {
  cart: QuotationCartItem[];
  lastAddedId?: string | null;
  onUpdateItem: (productId: string, patch: Partial<QuotationCartItem>) => void;
  onRemoveItem: (productId: string) => void;
}

export function QuotationBillCards({
  cart,
  lastAddedId,
  onUpdateItem,
  onRemoveItem,
}: QuotationBillCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayCart = [...cart].reverse();

  useEffect(() => {
    if (!lastAddedId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-cart-id="${lastAddedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lastAddedId, cart.length]);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center bg-muted/20">
        <p className="text-lg font-semibold text-foreground">Your bill is empty</p>
        <p className="text-base text-muted-foreground mt-2 max-w-sm leading-relaxed">
          Use the panel on the <strong>right</strong> to search products, then click{' '}
          <strong>+ Add</strong> to put them here.
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto p-3 space-y-3 bg-muted/15">
      {displayCart.map((item, idx) => {
        const lineNum = cart.length - idx;
        const isNew = item.productId === lastAddedId;
        const hasOverride = item.manualUnitPrice != null;

        return (
          <article
            key={item.productId}
            data-cart-id={item.productId}
            className={cn(
              'rounded-xl border-2 bg-card p-4 shadow-sm transition-colors',
              isNew ? 'border-green-500/60 bg-green-500/5' : 'border-border'
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">#{lineNum}</span>
                  <span className="font-mono text-base font-bold tracking-tight">{item.sku}</span>
                </div>
                <p className="text-base text-foreground leading-snug mt-1">{item.name}</p>
                {(item.brand || item.color) && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[item.brand, item.color].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Line total</p>
                <p className="text-xl font-bold tabular-nums text-primary">
                  {formatInr(item.lineTotals.lineAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() =>
                      onUpdateItem(item.productId, {
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    className="h-10 text-center text-lg font-bold px-1"
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() =>
                      onUpdateItem(item.productId, { quantity: item.quantity + 1 })
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={hasOverride}
                  className="h-10 text-base text-center"
                  value={item.itemDiscountPct}
                  onChange={(e) =>
                    onUpdateItem(item.productId, {
                      itemDiscountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      manualUnitPrice: null,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">List price</Label>
                <p className="h-10 flex items-center text-base font-medium tabular-nums">
                  {formatInr(item.listPrice)}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Selling rate</Label>
                <p className="h-10 flex items-center text-base font-semibold tabular-nums">
                  {formatInr(item.lineTotals.lineSellingUnit)}
                </p>
              </div>
            </div>

            <div className="flex items-end gap-2 mt-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Net price override (optional)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Leave blank to use discount %"
                  className="h-10 text-base"
                  value={item.manualUnitPrice ?? ''}
                  onChange={(e) =>
                    onUpdateItem(item.productId, {
                      manualUnitPrice: e.target.value ? Number(e.target.value) : null,
                      itemDiscountPct: e.target.value ? 0 : item.itemDiscountPct,
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                onClick={() => onRemoveItem(item.productId)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
