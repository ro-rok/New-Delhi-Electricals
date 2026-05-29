export const ALL_CATEGORIES = 'All';

export type QuotationStatus = 'draft' | 'final' | 'void';
export type GstMode = 'inclusive' | 'exclusive';

export interface QuotationCustomer {
  name: string;
  phone: string;
  gstNumber: string;
  address: string;
}

export interface QuotationLineTotals {
  lpTotal: number;
  lineSellingUnit: number;
  lineAmount: number;
}

export interface QuotationCartItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  series?: string | null;
  color?: string | null;
  listPrice: number;
  quantity: number;
  itemDiscountPct: number;
  manualUnitPrice?: number | null;
  lineTotals: QuotationLineTotals;
  isManual?: boolean;
}

export interface QuotationPricing {
  lpSubtotal: number;
  subtotal: number;
  overallDiscountPct: number;
  discountedSubtotal: number;
  gstMode: GstMode;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  customer: QuotationCustomer;
  items: QuotationCartItem[];
  pricing: QuotationPricing;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface QuotationCategory {
  name: string;
  productCount: number;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface FacetField {
  key: string;
  label: string;
  options: FacetOption[];
}

export interface QuotationProductRow {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category?: string | null;
  series?: string | null;
  listPrice: number;
  subcategory?: string | null;
  specs: Record<string, unknown>;
  color?: string | null;
}

export interface FrequentProduct {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  listPrice: number;
  count: number;
}

export interface QuotationCreatePayload {
  status: QuotationStatus;
  customer: QuotationCustomer;
  items: Array<{
    productId: string;
    quantity: number;
    itemDiscountPct: number;
    manualUnitPrice?: number | null;
    isManual?: boolean;
    name?: string;
    listPrice?: number;
    brand?: string;
    sku?: string;
  }>;
  overallDiscountPct: number;
  gstMode: GstMode;
  gstRate: number;
  notes?: string | null;
}
