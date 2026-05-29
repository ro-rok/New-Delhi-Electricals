import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatInr } from '@/lib/quotationPricing';
import type { GstMode, QuotationPricing } from '@/types/quotation';

interface QuotationTotalsProps {
  pricing: QuotationPricing;
  overallDiscountPct: number;
  gstMode: GstMode;
  gstRate: number;
  onOverallDiscountChange: (v: number) => void;
  onGstModeChange: (v: GstMode) => void;
  onGstRateChange: (v: number) => void;
}

export function QuotationTotals({
  pricing,
  overallDiscountPct,
  gstMode,
  gstRate,
  onOverallDiscountChange,
  onGstModeChange,
  onGstRateChange,
}: QuotationTotalsProps) {
  return (
    <div className="space-y-3 border-t pt-3">
      <div>
        <p className="text-sm font-semibold">Summary</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Item discounts apply per line first; overall % applies to the subtotal after that.
        </p>
      </div>
      <div className="space-y-2 text-base">
        <div className="flex justify-between text-muted-foreground">
          <span>List price total</span>
          <span className="tabular-nums">{formatInr(pricing.lpSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums">{formatInr(pricing.subtotal)}</span>
        </div>
        <div className="rounded-lg border-2 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Overall discount %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={overallDiscountPct}
              onChange={(e) =>
                onOverallDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              className="h-11 w-24 text-right text-lg font-semibold"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <span>After discount</span>
          <span className="tabular-nums">{formatInr(pricing.discountedSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm">GST included in price</Label>
            <Switch
              checked={gstMode === 'inclusive'}
              onCheckedChange={(c) => onGstModeChange(c ? 'inclusive' : 'exclusive')}
            />
          </div>
          <Select value={String(gstRate)} onValueChange={(v) => onGstRateChange(Number(v))}>
            <SelectTrigger className="h-11 w-24 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 5, 12, 18, 28].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST</span>
          <span>{formatInr(pricing.gstAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-xl pt-2 border-t">
          <span>Grand Total</span>
          <span className="tabular-nums text-primary">{formatInr(pricing.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
