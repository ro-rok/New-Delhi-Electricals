import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatInr } from '@/lib/quotationPricing';
import { ManualLineEntry } from './ManualLineEntry';
import type { QuotationCartItem } from '@/types/quotation';

interface TallySalesLineTableProps {
  cart: QuotationCartItem[];
  lastAddedId?: string | null;
  onUpdateItem: (productId: string, patch: Partial<QuotationCartItem>) => void;
  onRemoveItem: (productId: string) => void;
  onAddManualItem: (params: {
    name: string;
    quantity: number;
    listPrice: number;
    itemDiscountPct: number;
  }) => string;
  onManualItemAdded?: (productId: string) => void;
  onAfterDiscountEnter?: () => void;
}

const th =
  'border border-[#8ca0b3] bg-[#d4e4f7] px-2 py-2 text-left text-sm font-semibold text-[#1a3a5c] whitespace-nowrap';
const td = 'border border-[#8ca0b3] px-2 py-1.5 align-middle text-sm';

export function TallySalesLineTable({
  cart,
  lastAddedId,
  onUpdateItem,
  onRemoveItem,
  onAddManualItem,
  onManualItemAdded,
  onAfterDiscountEnter,
}: TallySalesLineTableProps) {
  const [editingDiscId, setEditingDiscId] = useState<string | null>(null);
  const [discDraft, setDiscDraft] = useState('');
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [qtyDraft, setQtyDraft] = useState('');
  const focusPendingRef = useRef<string | null>(null);

  const commitQuantity = (productId: string, raw: string) => {
    const v = Math.max(1, parseInt(raw, 10) || 1);
    onUpdateItem(productId, { quantity: v });
  };

  const commitDiscount = (productId: string, raw: string) => {
    const v =
      raw.trim() === '' ? 0 : Math.min(100, Math.max(0, Number.parseFloat(raw) || 0));
    onUpdateItem(productId, { itemDiscountPct: v, manualUnitPrice: null });
  };

  useEffect(() => {
    if (!lastAddedId) return;
    focusPendingRef.current = lastAddedId;
    setEditingDiscId(lastAddedId);
    setDiscDraft('');
  }, [lastAddedId]);

  useEffect(() => {
    const id = focusPendingRef.current;
    if (!id) return;
    const t = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-disc-input="${id}"]`);
      if (el) {
        el.focus();
        el.select();
        focusPendingRef.current = null;
      }
    });
    return () => cancelAnimationFrame(t);
  }, [lastAddedId, cart.length, editingDiscId]);

  const handleDiscKeyDown = (productId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commitDiscount(productId, discDraft);
    setEditingDiscId(null);
    setDiscDraft('');
    onAfterDiscountEnter?.();
  };

  const handleDiscBlur = (productId: string) => {
    if (editingDiscId !== productId) return;
    commitDiscount(productId, discDraft);
    setEditingDiscId(null);
    setDiscDraft('');
  };

  const stopRowTouch = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(th, 'w-10 text-center')}>Sl</th>
            <th className={cn(th, 'min-w-[200px]')}>Name of Item</th>
            <th className={cn(th, 'w-20 text-center')}>Qty</th>
            <th className={cn(th, 'w-24 text-right')}>Rate</th>
            <th className={cn(th, 'w-20 text-right')}>List Price</th>
            <th className={cn(th, 'w-16 text-center')}>Disc %</th>
            <th className={cn(th, 'w-28 text-right')}>Amount</th>
            <th className={cn(th, 'w-24 text-center print-hide')}>Net Rate</th>
            <th className={cn(th, 'w-8 print-hide')} />
          </tr>
        </thead>
        <tbody>
          {cart.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="border border-[#8ca0b3] px-4 py-16 text-center text-base text-[#5a6a7a] bg-[#fafafa]"
              >
                <p className="font-semibold text-[#1a3a5c]">No items in this voucher</p>
                <p className="mt-2 text-sm">
                  Search products below, or use &quot;Add item not in catalogue&quot; for custom lines.
                </p>
              </td>
            </tr>
          ) : (
            cart.map((item, idx) => {
              const isNew = item.productId === lastAddedId;
              const hasOverride = item.manualUnitPrice != null;

              return (
                <tr
                  key={item.productId}
                  data-cart-id={item.productId}
                  className={cn(
                    'transition-colors',
                    isNew ? 'bg-[#fff9c4]' : 'hover:bg-[#f5f9ff]'
                  )}
                >
                  <td className={cn(td, 'text-center tabular-nums text-[#5a6a7a]')}>
                    {idx + 1}
                  </td>
                  <td className={cn(td, 'min-w-0')}>
                    <p className="font-semibold text-[#1a3a5c] leading-tight">{item.name}</p>
                    <p className="text-xs text-[#5a6a7a] font-mono mt-0.5">
                      {item.sku}
                      {item.isManual && (
                        <span className="ml-1.5 text-[#1a5276] font-sans font-semibold">
                          · Custom
                        </span>
                      )}
                    </p>
                    {(item.brand || item.color) && (
                      <p className="text-xs text-[#5a6a7a] mt-0.5">
                        {[item.brand, item.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </td>
                  <td
                    className={cn(td, 'p-1')}
                    data-no-row-click
                    onPointerDown={stopRowTouch}
                    onClick={stopRowTouch}
                  >
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      data-cart-field="quantity"
                      className="h-10 w-full min-w-[3.5rem] text-center text-base font-semibold border-[#8ca0b3] bg-white rounded-none focus-visible:ring-[#236192] touch-manipulation"
                      value={
                        editingQtyId === item.productId ? qtyDraft : String(item.quantity)
                      }
                      onFocus={() => {
                        setEditingQtyId(item.productId);
                        setQtyDraft(String(item.quantity));
                      }}
                      onChange={(e) => setQtyDraft(e.target.value)}
                      onBlur={() => {
                        if (editingQtyId !== item.productId) return;
                        commitQuantity(item.productId, qtyDraft);
                        setEditingQtyId(null);
                        setQtyDraft('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        commitQuantity(item.productId, qtyDraft);
                        setEditingQtyId(null);
                        setQtyDraft('');
                        (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className={cn(td, 'text-right tabular-nums font-medium whitespace-nowrap')}>
                    {formatInr(item.lineTotals.lineSellingUnit)}
                  </td>
                  <td className={cn(td, 'text-right tabular-nums text-[#5a6a7a] whitespace-nowrap')}>
                    {formatInr(item.listPrice)}
                  </td>
                  <td
                    className={cn(td, 'p-1')}
                    data-no-row-click
                    onPointerDown={stopRowTouch}
                    onClick={stopRowTouch}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      inputMode="decimal"
                      disabled={hasOverride}
                      data-disc-input={item.productId}
                      data-cart-field="discount"
                      placeholder="0"
                      className={cn(
                        'h-10 w-full text-center text-base font-semibold border-[#8ca0b3] bg-white rounded-none focus-visible:ring-[#236192] touch-manipulation',
                        hasOverride && 'opacity-50',
                        isNew && 'ring-2 ring-primary/40'
                      )}
                      value={
                        editingDiscId === item.productId
                          ? discDraft
                          : item.itemDiscountPct === 0
                            ? ''
                            : String(item.itemDiscountPct)
                      }
                      onFocus={() => {
                        setEditingDiscId(item.productId);
                        setDiscDraft(
                          item.itemDiscountPct === 0 ? '' : String(item.itemDiscountPct)
                        );
                      }}
                      onChange={(e) => setDiscDraft(e.target.value)}
                      onBlur={() => handleDiscBlur(item.productId)}
                      onKeyDown={(e) => handleDiscKeyDown(item.productId, e)}
                    />
                  </td>
                  <td className={cn(td, 'text-right tabular-nums font-bold text-[#1a3a5c] whitespace-nowrap')}>
                    {formatInr(item.lineTotals.lineAmount)}
                  </td>
                  <td
                    className={cn(td, 'p-1 print-hide')}
                    data-no-row-click
                    onPointerDown={stopRowTouch}
                    onClick={stopRowTouch}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      data-cart-field="net-rate"
                      placeholder="—"
                      title="Override net rate per unit"
                      className="h-10 w-full text-right text-sm border-[#8ca0b3] bg-white rounded-none touch-manipulation"
                      value={item.manualUnitPrice ?? ''}
                      onChange={(e) =>
                        onUpdateItem(item.productId, {
                          manualUnitPrice: e.target.value ? Number(e.target.value) : null,
                          itemDiscountPct: e.target.value ? 0 : item.itemDiscountPct,
                        })
                      }
                    />
                  </td>
                  <td className={cn(td, 'p-0 text-center print-hide')}>
                    <button
                      type="button"
                      className="w-full h-full min-h-[36px] text-xs text-[#b91c1c] hover:bg-[#fee2e2] px-1"
                      onClick={() => onRemoveItem(item.productId)}
                      title="Remove line (Del)"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })
          )}
          <ManualLineEntry onAdd={onAddManualItem} onAdded={onManualItemAdded} />
        </tbody>
      </table>
    </div>
  );
}
