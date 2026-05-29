import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatInr } from '@/lib/quotationPricing';
import type { QuotationCartItem } from '@/types/quotation';
import { TallySalesLineTable } from './TallySalesLineTable';
import { TallyAmountPanel } from './TallyAmountPanel';
import type { GstMode, QuotationCustomer, QuotationPricing } from '@/types/quotation';

interface QuotationPanelProps {
  cart: QuotationCartItem[];
  customer: QuotationCustomer;
  pricing: QuotationPricing;
  overallDiscountPct: number;
  gstMode: GstMode;
  gstRate: number;
  quotationNumber?: string;
  lastAddedId?: string | null;
  onCustomerChange: (c: QuotationCustomer) => void;
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
  onOverallDiscountChange: (v: number) => void;
  onGstModeChange: (v: GstMode) => void;
  onGstRateChange: (v: number) => void;
}

function todayDisplay() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function QuotationPanel({
  cart,
  customer,
  pricing,
  overallDiscountPct,
  gstMode,
  gstRate,
  quotationNumber,
  lastAddedId,
  onCustomerChange,
  onUpdateItem,
  onRemoveItem,
  onAddManualItem,
  onManualItemAdded,
  onAfterDiscountEnter,
  onOverallDiscountChange,
  onGstModeChange,
  onGstRateChange,
}: QuotationPanelProps) {
  const lineCount = cart.length;
  const totalUnits = cart.reduce((s, i) => s + i.quantity, 0);

  const setCustomer = (field: keyof QuotationCustomer, value: string) => {
    onCustomerChange({ ...customer, [field]: value });
  };

  return (
    <div className="tally-voucher flex flex-col min-h-min bg-[#f0f4f8] font-sans">
      {/* Tally title bar */}
      <div className="shrink-0 flex items-stretch border-b-2 border-[#0d3a5c]">
        <div className="flex-1 bg-[#236192] text-white px-4 py-2.5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-wide">Sales Quotation</h2>
            <p className="text-xs text-white/80 mt-0.5">New Delhi Electricals</p>
          </div>
          {lineCount > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Bill amount</p>
              <p className="text-2xl font-bold tabular-nums">{formatInr(pricing.grandTotal)}</p>
            </div>
          )}
        </div>
        <div className="bg-[#1a5276] text-white px-4 py-2 flex flex-col justify-center min-w-[140px] border-l border-[#0d3a5c]/40">
          <div className="flex justify-between gap-3 text-xs">
            <span className="text-white/70">Date</span>
            <span className="font-medium tabular-nums">{todayDisplay()}</span>
          </div>
          <div className="flex justify-between gap-3 text-xs mt-1">
            <span className="text-white/70">Voucher No.</span>
            <span className="font-mono font-semibold">{quotationNumber ?? '—'}</span>
          </div>
          {lineCount > 0 && (
            <div className="flex justify-between gap-3 text-xs mt-1">
              <span className="text-white/70">Items</span>
              <span className="tabular-nums">
                {lineCount} ({totalUnits} qty)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Party ledger */}
      <div className="shrink-0 bg-white border-b border-[#8ca0b3] px-3 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <div>
            <Label htmlFor="tally-party" className="text-xs font-semibold text-[#1a3a5c]">
              Party A/c Name
            </Label>
            <Input
              id="tally-party"
              value={customer.name}
              onChange={(e) => setCustomer('name', e.target.value)}
              placeholder="Customer / party name"
              className="h-10 mt-0.5 text-base border-[#8ca0b3] rounded-none bg-[#fffff0] focus-visible:ring-[#236192]"
            />
          </div>
          <div className="lg:w-40">
            <Label htmlFor="tally-phone" className="text-xs font-semibold text-[#1a3a5c]">
              Phone
            </Label>
            <Input
              id="tally-phone"
              value={customer.phone}
              onChange={(e) => setCustomer('phone', e.target.value)}
              placeholder="Mobile"
              className="h-10 mt-0.5 text-base border-[#8ca0b3] rounded-none bg-white focus-visible:ring-[#236192]"
            />
          </div>
          <div className="lg:w-44">
            <Label htmlFor="tally-gst" className="text-xs font-semibold text-[#1a3a5c]">
              GSTIN / UIN
            </Label>
            <Input
              id="tally-gst"
              value={customer.gstNumber}
              onChange={(e) => setCustomer('gstNumber', e.target.value)}
              placeholder="Optional"
              className="h-10 mt-0.5 text-base border-[#8ca0b3] rounded-none bg-white focus-visible:ring-[#236192]"
            />
          </div>
        </div>
      </div>

      {/* Item lines — grows with each product added (no inner scroll) */}
      <TallySalesLineTable
        cart={cart}
        lastAddedId={lastAddedId}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
        onAddManualItem={onAddManualItem}
        onManualItemAdded={onManualItemAdded}
        onAfterDiscountEnter={onAfterDiscountEnter}
      />

      {/* GST & totals — always after last line */}
      <div className="shrink-0 flex flex-col sm:flex-row border-t-2 border-[#8ca0b3] bg-white">
        <div className="flex-1 min-w-0 border-b sm:border-b-0 sm:border-r border-[#8ca0b3] p-3">
          <Label htmlFor="tally-narration" className="text-xs font-semibold text-[#1a3a5c]">
            Narration / Address
          </Label>
          <Textarea
            id="tally-narration"
            value={customer.address}
            onChange={(e) => setCustomer('address', e.target.value)}
            rows={2}
            placeholder="Delivery address, site reference, or remarks…"
            className="mt-1 text-sm border-[#8ca0b3] rounded-none resize-none bg-[#fffff0] focus-visible:ring-[#236192]"
          />
        </div>
        <TallyAmountPanel
          pricing={pricing}
          overallDiscountPct={overallDiscountPct}
          gstMode={gstMode}
          gstRate={gstRate}
          lineCount={lineCount}
          onOverallDiscountChange={onOverallDiscountChange}
          onGstModeChange={onGstModeChange}
          onGstRateChange={onGstRateChange}
        />
      </div>
    </div>
  );
}
