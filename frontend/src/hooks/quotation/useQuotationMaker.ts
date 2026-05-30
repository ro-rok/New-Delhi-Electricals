import { useCallback, useMemo, useState } from 'react';
import {
  buildCartItemFromProduct,
  buildCartItemManual,
  computeQuotationPricing,
  recomputeCartItem,
} from '@/lib/quotationPricing';
import type {
  GstMode,
  QuotationCartItem,
  QuotationCustomer,
  QuotationProductRow,
  QuotationStatus,
} from '@/types/quotation';

const defaultCustomer: QuotationCustomer = {
  name: '',
  phone: '',
  gstNumber: '',
  address: '',
};

export function useQuotationMaker(initial?: {
  quotationId?: string | null;
  items?: QuotationCartItem[];
  customer?: QuotationCustomer;
  overallDiscountPct?: number;
  gstMode?: GstMode;
  gstRate?: number;
  status?: QuotationStatus;
  notes?: string | null;
}) {
  const [quotationId, setQuotationId] = useState<string | null>(initial?.quotationId ?? null);
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<QuotationCartItem[]>(initial?.items ?? []);
  const [customer, setCustomer] = useState<QuotationCustomer>(initial?.customer ?? defaultCustomer);
  const [overallDiscountPct, setOverallDiscountPct] = useState(initial?.overallDiscountPct ?? 0);
  const [gstMode, setGstMode] = useState<GstMode>(initial?.gstMode ?? 'exclusive');
  const [gstRate, setGstRate] = useState(initial?.gstRate ?? 18);
  const [status, setStatus] = useState<QuotationStatus>(initial?.status ?? 'draft');
  const [notes, setNotes] = useState<string | null>(initial?.notes ?? null);
  const [dirty, setDirty] = useState(false);

  const pricing = useMemo(
    () => computeQuotationPricing(cart, overallDiscountPct, gstMode, gstRate),
    [cart, overallDiscountPct, gstMode, gstRate]
  );

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const addProduct = useCallback((product: QuotationProductRow, quantity = 1) => {
    const lineKey = product.id || product.sku;
    if (!lineKey) return;

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === lineKey || i.sku === product.sku);
      if (idx >= 0) {
        const updated = [...prev];
        const item = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        updated[idx] = recomputeCartItem(item);
        return updated;
      }
      return [...prev, buildCartItemFromProduct(product, quantity)];
    });
    setDirty(true);
  }, []);

  const addManualItem = useCallback(
    (params: { name: string; quantity: number; listPrice: number; itemDiscountPct?: number }) => {
      const item = buildCartItemManual(params);
      setCart((prev) => [...prev, item]);
      setDirty(true);
      return item.productId;
    },
    []
  );

  const updateCartItem = useCallback((productId: string, patch: Partial<QuotationCartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        return recomputeCartItem({ ...item, ...patch });
      })
    );
    setDirty(true);
  }, []);

  const removeCartItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
    setDirty(true);
  }, []);

  const mergeItems = useCallback((items: QuotationCartItem[]) => {
    setCart((prev) => {
      const map = new Map(prev.map((i) => [i.productId, i]));
      for (const item of items) {
        const existing = map.get(item.productId);
        if (existing) {
          map.set(
            item.productId,
            recomputeCartItem({
              ...existing,
              quantity: existing.quantity + item.quantity,
            })
          );
        } else {
          map.set(item.productId, recomputeCartItem(item));
        }
      }
      return Array.from(map.values());
    });
    setDirty(true);
  }, []);

  const resetCart = useCallback(() => {
    setCart([]);
    setDirty(true);
  }, []);

  const loadQuotation = useCallback(
    (data: {
      id: string;
      items: QuotationCartItem[];
      customer: QuotationCustomer;
      overallDiscountPct: number;
      gstMode: GstMode;
      gstRate: number;
      status: QuotationStatus;
      notes?: string | null;
    }) => {
      setQuotationId(data.id);
      setCart(
        data.items.map((item) =>
          recomputeCartItem({
            ...item,
            isManual: item.isManual ?? item.productId.startsWith('manual-'),
          })
        )
      );
      setCustomer(data.customer);
      setOverallDiscountPct(data.overallDiscountPct);
      setGstMode(data.gstMode);
      setGstRate(data.gstRate);
      setStatus(data.status);
      setNotes(data.notes ?? null);
      setDirty(false);
    },
    []
  );

  const markClean = useCallback(() => setDirty(false), []);

  return {
    quotationId,
    setQuotationId,
    category,
    setCategory,
    filters,
    setFilter,
    clearFilters,
    cart,
    addProduct,
    addManualItem,
    updateCartItem,
    removeCartItem,
    mergeItems,
    resetCart,
    customer,
    setCustomer,
    overallDiscountPct,
    setOverallDiscountPct,
    gstMode,
    setGstMode,
    gstRate,
    setGstRate,
    status,
    setStatus,
    notes,
    setNotes,
    pricing,
    dirty,
    setDirty,
    loadQuotation,
    markClean,
  };
}
