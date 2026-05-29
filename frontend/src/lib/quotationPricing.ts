import type { GstMode, QuotationCartItem, QuotationLineTotals, QuotationPricing } from '@/types/quotation';

function effectiveUnitPrice(
  listPrice: number,
  itemDiscountPct: number,
  manualUnitPrice?: number | null
): number {
  if (manualUnitPrice != null) return manualUnitPrice;
  return listPrice * (1 - itemDiscountPct / 100);
}

export function computeLineTotals(
  listPrice: number,
  quantity: number,
  itemDiscountPct: number,
  manualUnitPrice?: number | null
): QuotationLineTotals {
  const lineSellingUnit = effectiveUnitPrice(listPrice, itemDiscountPct, manualUnitPrice);
  return {
    lpTotal: Math.round(listPrice * quantity * 100) / 100,
    lineSellingUnit: Math.round(lineSellingUnit * 100) / 100,
    lineAmount: Math.round(lineSellingUnit * quantity * 100) / 100,
  };
}

export function buildCartItemFromProduct(
  product: {
    id: string;
    sku: string;
    name: string;
    brand: string;
    series?: string | null;
    color?: string | null;
    listPrice: number;
  },
  quantity = 1
): QuotationCartItem {
  const lineTotals = computeLineTotals(product.listPrice, quantity, 0, null);
  const productId = product.id || product.sku;
  return {
    productId,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    series: product.series,
    color: product.color,
    listPrice: product.listPrice,
    quantity,
    itemDiscountPct: 0,
    manualUnitPrice: null,
    lineTotals,
    isManual: false,
  };
}

export function buildCartItemManual(params: {
  name: string;
  quantity: number;
  listPrice: number;
  itemDiscountPct?: number;
  brand?: string;
}): QuotationCartItem {
  const id = `manual-${crypto.randomUUID()}`;
  const sku = `MISC-${id.slice(-6).toUpperCase()}`;
  const qty = Math.max(1, params.quantity);
  const listPrice = Math.max(0, params.listPrice);
  const disc = Math.min(100, Math.max(0, params.itemDiscountPct ?? 0));
  return recomputeCartItem({
    productId: id,
    sku,
    name: params.name.trim() || 'Custom item',
    brand: params.brand?.trim() || 'Misc',
    listPrice,
    quantity: qty,
    itemDiscountPct: disc,
    manualUnitPrice: null,
    lineTotals: computeLineTotals(listPrice, qty, disc, null),
    isManual: true,
  });
}

export function recomputeCartItem(item: QuotationCartItem): QuotationCartItem {
  return {
    ...item,
    lineTotals: computeLineTotals(
      item.listPrice,
      item.quantity,
      item.itemDiscountPct,
      item.manualUnitPrice
    ),
  };
}

export function computeQuotationPricing(
  items: QuotationCartItem[],
  overallDiscountPct: number,
  gstMode: GstMode,
  gstRate: number
): QuotationPricing {
  const lpSubtotal = items.reduce((s, i) => s + i.lineTotals.lpTotal, 0);
  const subtotal = items.reduce((s, i) => s + i.lineTotals.lineAmount, 0);
  const discountedSubtotal = Math.round(subtotal * (1 - overallDiscountPct / 100) * 100) / 100;

  let gstAmount: number;
  let grandTotal: number;

  if (gstMode === 'exclusive') {
    gstAmount = Math.round(discountedSubtotal * (gstRate / 100) * 100) / 100;
    grandTotal = Math.round((discountedSubtotal + gstAmount) * 100) / 100;
  } else {
    grandTotal = discountedSubtotal;
    gstAmount =
      gstRate > 0
        ? Math.round((grandTotal - grandTotal / (1 + gstRate / 100)) * 100) / 100
        : 0;
  }

  return {
    lpSubtotal: Math.round(lpSubtotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    overallDiscountPct,
    discountedSubtotal,
    gstMode,
    gstRate,
    gstAmount,
    grandTotal,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
