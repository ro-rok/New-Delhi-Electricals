import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface TallyAmountPanelProps {
  pricing: QuotationPricing;
  overallDiscountPct: number;
  gstMode: GstMode;
  gstRate: number;
  lineCount: number;
  onOverallDiscountChange: (v: number) => void;
  onGstModeChange: (v: GstMode) => void;
  onGstRateChange: (v: number) => void;
}

function AmountRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 px-3 py-1.5 border-b border-[#8ca0b3] text-sm ${
        highlight ? 'bg-[#d4e4f7]' : ''
      } ${bold ? 'font-bold text-base' : ''}`}
    >
      <span className="text-[#1a3a5c]">{label}</span>
      <span className="tabular-nums text-right shrink-0">{value}</span>
    </div>
  );
}

export function TallyAmountPanel({
  pricing,
  overallDiscountPct,
  gstMode,
  gstRate,
  lineCount,
  onOverallDiscountChange,
  onGstModeChange,
  onGstRateChange,
}: TallyAmountPanelProps) {
  const itemDiscTotal = pricing.lpSubtotal - pricing.subtotal;

  return (
    <div className="w-full sm:w-[320px] shrink-0 bg-[#fafcff] border-l border-[#8ca0b3] flex flex-col">
      <div className="bg-[#d4e4f7] border-b border-[#8ca0b3] px-3 py-2">
        <p className="text-sm font-bold text-[#1a3a5c] uppercase tracking-wide">Amount</p>
      </div>

      <AmountRow label="Item Total" value={formatInr(pricing.lpSubtotal)} />
      {itemDiscTotal > 0 && (
        <AmountRow label="Less : Item Discount" value={`(${formatInr(itemDiscTotal)})`} />
      )}
      <AmountRow label="Subtotal" value={formatInr(pricing.subtotal)} />

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#8ca0b3] bg-white">
        <Label className="text-xs text-[#1a3a5c] shrink-0">Bill disc. %</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.5}
          disabled={lineCount === 0}
          value={overallDiscountPct}
          onChange={(e) =>
            onOverallDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
          }
          className="h-9 w-20 text-right text-base font-semibold border-[#8ca0b3] rounded-none"
        />
      </div>

      {overallDiscountPct > 0 && (
        <AmountRow
          label={`Less : ${overallDiscountPct}% on Subtotal`}
          value={`(${formatInr(pricing.subtotal - pricing.discountedSubtotal)})`}
        />
      )}
      <AmountRow label="Taxable Amount" value={formatInr(pricing.discountedSubtotal)} />

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#8ca0b3] bg-white text-xs">
        <div className="flex items-center gap-2">
          <Label className="text-[#1a3a5c]">GST incl.</Label>
          <Switch
            checked={gstMode === 'inclusive'}
            onCheckedChange={(c) => onGstModeChange(c ? 'inclusive' : 'exclusive')}
          />
        </div>
        <Select value={String(gstRate)} onValueChange={(v) => onGstRateChange(Number(v))}>
          <SelectTrigger className="h-8 w-20 text-xs border-[#8ca0b3] rounded-none">
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

      {gstRate > 0 && (
        <>
          <AmountRow
            label={`CGST @ ${gstRate / 2}%`}
            value={formatInr(pricing.gstAmount / 2)}
          />
          <AmountRow
            label={`SGST @ ${gstRate / 2}%`}
            value={formatInr(pricing.gstAmount / 2)}
          />
        </>
      )}

      <AmountRow
        label="Grand Total"
        value={formatInr(pricing.grandTotal)}
        bold
        highlight
      />
    </div>
  );
}
