const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Analytics API error: ${res.status}`);
  }
  return res.json();
}

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export type DateRangePreset = '7d' | '14d' | '30d' | 'custom';

export interface RangeParams {
  range: DateRangePreset;
  customStart?: string;
  customEnd?: string;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  inquiries: PeriodComparison;
  newInquiries: PeriodComparison;
  resolvedInquiries: PeriodComparison;
  quotations: PeriodComparison;
  adminActions: PeriodComparison;
  totalProducts: number;
  activeProducts: number;
  conversionRate: PeriodComparison;
  periodStart: string;
  periodEnd: string;
}

export async function getAnalyticsOverview(params: RangeParams): Promise<AnalyticsOverview> {
  return apiFetch('/api/admin/analytics/overview', params as Record<string, string>);
}

// ─── Timeseries ───────────────────────────────────────────────────────────────

export interface TimeseriesDataPoint {
  date: string;
  inquiries: number;
  resolved: number;
  quotations: number;
}

export interface AnalyticsTimeseries {
  dataPoints: TimeseriesDataPoint[];
  startDate: string;
  endDate: string;
}

export async function getAnalyticsTimeseries(params: RangeParams): Promise<AnalyticsTimeseries> {
  return apiFetch('/api/admin/analytics/timeseries', params as Record<string, string>);
}

// ─── Top Products ─────────────────────────────────────────────────────────────

export interface TopProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  timesQuoted: number;
  totalQty: number;
}

export async function getTopProducts(params: RangeParams & { limit?: number }): Promise<TopProduct[]> {
  const p: Record<string, string> = { ...params };
  if (params.limit !== undefined) p.limit = String(params.limit);
  return apiFetch('/api/admin/analytics/top-products', p);
}

// ─── Top Categories ───────────────────────────────────────────────────────────

export interface TopCategory {
  id: string;
  name: string;
  timesQuoted: number;
  totalQty: number;
  uniqueProducts: number;
}

export async function getTopCategories(params: RangeParams): Promise<TopCategory[]> {
  return apiFetch('/api/admin/analytics/top-categories', params as Record<string, string>);
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  dropOff: number;
}

export interface AnalyticsFunnel {
  stages: FunnelStage[];
}

export async function getAnalyticsFunnel(params: RangeParams): Promise<AnalyticsFunnel> {
  return apiFetch('/api/admin/analytics/funnel', params as Record<string, string>);
}

// ─── Brands Breakdown ─────────────────────────────────────────────────────────

export interface BrandBreakdown {
  id: string;
  name: string;
  timesQuoted: number;
  totalQty: number;
  uniqueProducts: number;
}

export async function getBrandsBreakdown(params: RangeParams): Promise<BrandBreakdown[]> {
  return apiFetch('/api/admin/analytics/brands-breakdown', params as Record<string, string>);
}
