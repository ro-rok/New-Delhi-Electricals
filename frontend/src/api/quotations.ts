import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ALL_CATEGORIES,
  type FacetField,
  type FrequentProduct,
  type GstMode,
  type Quotation,
  type QuotationCategory,
  type QuotationCreatePayload,
  type QuotationProductRow,
  type QuotationStatus,
} from '@/types/quotation';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function toCamelKey(key: string): string {
  if (key === '_id') return 'id';
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function snakeToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[toCamelKey(k)] = snakeToCamel(v);
    }
    return out;
  }
  return obj;
}

function mapQuotation(raw: Record<string, unknown>): Quotation {
  const d = snakeToCamel(raw) as Quotation;
  return d;
}

function mapProductRow(raw: Record<string, unknown>): QuotationProductRow {
  const d = snakeToCamel(raw) as Record<string, unknown>;
  return {
    id: String(raw._id ?? raw.id ?? d.id ?? d.Id ?? ''),
    sku: String(d.sku ?? ''),
    name: String(d.name ?? ''),
    brand: String(d.brand ?? ''),
    category: (d.category as string) ?? null,
    series: (d.series as string) ?? null,
    listPrice: Number(d.listPrice ?? 0),
    subcategory: (d.subcategory as string) ?? null,
    specs: (d.specs as Record<string, unknown>) ?? {},
    color: (d.color as string) ?? null,
  };
}

export async function fetchQuotationCategories(): Promise<QuotationCategory[]> {
  const res = await fetch(`${API_BASE}/api/admin/quotations/quotation-maker/categories`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<unknown[]>(res);
  return (data as Record<string, unknown>[]).map((row) => ({
    name: String(row.name ?? ''),
    productCount: Number(row.product_count ?? row.productCount ?? 0),
  }));
}

export async function fetchQuotationFacets(
  category: string,
  filters: Record<string, string>
): Promise<FacetField[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  // Sidebar scope last so it is never overwritten by filter keys
  params.set('category', category);
  const res = await fetch(
    `${API_BASE}/api/admin/quotations/quotation-maker/facets?${params}`,
    { headers: authHeaders() }
  );
  const data = await handleResponse<{ facets: FacetField[] }>(res);
  return data.facets ?? [];
}

export async function fetchQuotationProducts(params: {
  category: string;
  filters: Record<string, string>;
  q?: string;
  page: number;
  pageSize: number;
}): Promise<{ items: QuotationProductRow[]; total: number; page: number; pageSize: number }> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.q) search.set('q', params.q);
  Object.entries(params.filters).forEach(([k, v]) => {
    if (v) search.set(k, v);
  });
  search.set('category', params.category);
  const res = await fetch(
    `${API_BASE}/api/admin/quotations/quotation-maker/products?${search}`,
    { headers: authHeaders() }
  );
  const data = await handleResponse<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
  }>(res);
  return {
    items: (data.items ?? []).map(mapProductRow),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function fetchFrequentProducts(limit = 12): Promise<FrequentProduct[]> {
  const res = await fetch(
    `${API_BASE}/api/admin/quotations/quotation-maker/frequent?limit=${limit}`,
    { headers: authHeaders() }
  );
  const data = await handleResponse<Record<string, unknown>[]>(res);
  return data.map((row) => ({
    productId: String(row.product_id ?? row.productId ?? ''),
    sku: String(row.sku ?? ''),
    name: String(row.name ?? ''),
    brand: String(row.brand ?? ''),
    listPrice: Number(row.list_price ?? row.listPrice ?? 0),
    count: Number(row.count ?? 0),
  }));
}

export async function fetchRecentProducts(limit = 12): Promise<QuotationProductRow[]> {
  const res = await fetch(
    `${API_BASE}/api/admin/quotations/quotation-maker/recent?limit=${limit}`,
    { headers: authHeaders() }
  );
  const data = await handleResponse<Record<string, unknown>[]>(res);
  return data.map(mapProductRow);
}

export async function fetchQuotations(params?: {
  status?: QuotationStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Quotation[]; total: number }> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  search.set('page', String(params?.page ?? 1));
  search.set('pageSize', String(params?.pageSize ?? 20));
  const res = await fetch(`${API_BASE}/api/admin/quotations?${search}`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<{
    items: Record<string, unknown>[];
    total: number;
  }>(res);
  return {
    items: (data.items ?? []).map((q) => mapQuotation(q)),
    total: data.total,
  };
}

export async function fetchQuotation(id: string): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/api/admin/quotations/${id}`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<Record<string, unknown>>(res);
  return mapQuotation(data);
}

export async function createQuotation(payload: QuotationCreatePayload): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/api/admin/quotations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      status: payload.status,
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        gst_number: payload.customer.gstNumber,
        address: payload.customer.address,
      },
      items: payload.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        item_discount_pct: i.itemDiscountPct,
        manual_unit_price: i.manualUnitPrice ?? null,
      })),
      overall_discount_pct: payload.overallDiscountPct,
      gst_mode: payload.gstMode,
      gst_rate: payload.gstRate,
      notes: payload.notes,
    }),
  });
  const data = await handleResponse<Record<string, unknown>>(res);
  return mapQuotation(data);
}

export async function updateQuotation(
  id: string,
  payload: Partial<QuotationCreatePayload> & { status?: QuotationStatus }
): Promise<Quotation> {
  const body: Record<string, unknown> = {};
  if (payload.status) body.status = payload.status;
  if (payload.customer) {
    body.customer = {
      name: payload.customer.name,
      phone: payload.customer.phone,
      gst_number: payload.customer.gstNumber,
      address: payload.customer.address,
    };
  }
  if (payload.items) {
    body.items = payload.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      item_discount_pct: i.itemDiscountPct,
      manual_unit_price: i.manualUnitPrice ?? null,
    }));
  }
  if (payload.overallDiscountPct != null) body.overall_discount_pct = payload.overallDiscountPct;
  if (payload.gstMode) body.gst_mode = payload.gstMode;
  if (payload.gstRate != null) body.gst_rate = payload.gstRate;
  if (payload.notes !== undefined) body.notes = payload.notes;

  const res = await fetch(`${API_BASE}/api/admin/quotations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<Record<string, unknown>>(res);
  return mapQuotation(data);
}

export async function duplicateQuotation(id: string): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/api/admin/quotations/${id}/duplicate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await handleResponse<Record<string, unknown>>(res);
  return mapQuotation(data);
}

export async function deleteQuotation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/quotations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse<void>(res);
}

export async function downloadQuotationPdf(id: string): Promise<Blob> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/admin/quotations/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download PDF');
  return res.blob();
}

export function useQuotationCategories() {
  return useQuery({
    queryKey: ['qm-categories'],
    queryFn: fetchQuotationCategories,
    staleTime: 60_000,
  });
}

export function useQuotationFacets(category: string | null, filters: Record<string, string>) {
  const scope = category || ALL_CATEGORIES;
  return useQuery({
    queryKey: ['qm-facets', scope, filters],
    queryFn: () => fetchQuotationFacets(scope, filters),
    staleTime: 30_000,
  });
}

export function useQuotationProducts(
  category: string | null,
  filters: Record<string, string>,
  q: string,
  page: number,
  pageSize = 50
) {
  const scope = category || ALL_CATEGORIES;
  return useQuery({
    queryKey: ['qm-products', scope, filters, q, page, pageSize],
    queryFn: () =>
      fetchQuotationProducts({ category: scope, filters, q, page, pageSize }),
    placeholderData: (prev) => prev,
  });
}

export function useFrequentProducts() {
  return useQuery({
    queryKey: ['qm-frequent'],
    queryFn: () => fetchFrequentProducts(12),
    staleTime: 120_000,
  });
}

export function useRecentProducts() {
  return useQuery({
    queryKey: ['qm-recent'],
    queryFn: () => fetchRecentProducts(12),
    staleTime: 60_000,
  });
}

export function useQuotationsList(status?: QuotationStatus) {
  return useQuery({
    queryKey: ['quotations-list', status],
    queryFn: () => fetchQuotations({ status, pageSize: 50 }),
  });
}

export function useQuotation(id: string | null) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => fetchQuotation(id!),
    enabled: Boolean(id),
  });
}

export function useSaveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string | null;
      payload: QuotationCreatePayload;
    }) => {
      if (id) return updateQuotation(id, payload);
      return createQuotation(payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['quotations-list'] });
      qc.invalidateQueries({ queryKey: ['quotation', data.id] });
      qc.invalidateQueries({ queryKey: ['qm-frequent'] });
      qc.invalidateQueries({ queryKey: ['qm-recent'] });
    },
  });
}
