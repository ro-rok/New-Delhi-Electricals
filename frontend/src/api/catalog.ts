export interface ParsedRow {
  tempId: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  series?: string;
  listPrice: number;
  currency: string;
  page: number;
  confidence: number;
  imageUrl?: string;
}

export interface CatalogUploadResponse {
  catalog_import_id: string;
  status: string;
}

export interface CatalogPreviewLog {
  id: string;
  action: string;
  entity: string;
  entity_id?: string;
  admin_email: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CatalogPreviewResponse {
  import: {
    id: string;
    file_name: string;
    status: string;
    parsing_summary?: Record<string, unknown>;
  };
  rows: any[];
  logs?: CatalogPreviewLog[];
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function uploadCatalogPdf(file: File, token: string): Promise<CatalogUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/admin/catalogs/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload catalog PDF');
  }
  return res.json();
}

export interface CatalogProgressResponse {
  import_id: string;
  status: string;
  progress: {
    current_page: number;
    total_pages: number;
    stage: string;
    message: string;
    percentage: number;
  };
}

export async function getCatalogProgress(importId: string, token: string): Promise<CatalogProgressResponse> {
  const res = await fetch(`${API_BASE}/api/admin/catalogs/${importId}/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch catalog progress');
  }
  return res.json();
}

export async function getCatalogPreview(importId: string, token: string): Promise<CatalogPreviewResponse> {
  const res = await fetch(`${API_BASE}/api/admin/catalogs/${importId}/preview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch catalog preview');
  }
  return res.json();
}

export interface ApplyCatalogImportPayload {
  selected_rows: any[];
  createIfMissing?: boolean;
  dedupeStrategy?: string;
}

export interface ApplyCatalogImportResponse {
  created: Array<{ sku: string }>;
  updated: Array<{ sku: string }>;
  failed: Array<{ row_id?: string; sku?: string; reason: string }>;
}

export async function applyCatalogImport(
  importId: string,
  payload: ApplyCatalogImportPayload,
  token: string
): Promise<ApplyCatalogImportResponse> {
  const res = await fetch(`${API_BASE}/api/admin/catalogs/${importId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to apply catalog import');
  }
  return res.json();
}

// --- Price list updater ---

export interface PriceUpdateUploadResponse {
  job_id: string;
  brand: string;
  brand_product_count: number;
  status: string;
}

export interface PriceUpdateProgressResponse {
  job_id: string;
  status: string;
  brand: string;
  file_name: string;
  progress: {
    percentage: number;
    message: string;
    stage: string;
  };
  summary: Record<string, unknown>;
}

export interface PriceUpdateRow {
  sku: string;
  name: string;
  product_id: string | null;
  old_price: number | null;
  new_price: number | null;
  page?: number;
  status: 'matched' | 'pdf_only';
  match_status?: 'changed' | 'unchanged' | 'not_in_db' | 'parse_failed';
  selected?: boolean;
  /** Stays true while user is entering a manual price for a parse-failed row */
  needs_manual_price?: boolean;
}

export interface PriceUpdatePreviewResponse {
  job_id: string;
  brand: string;
  file_name: string;
  status: string;
  summary: {
    pdf_skus?: number;
    brand_products?: number;
    matched?: number;
    price_changed?: number;
    unchanged?: number;
    pdf_only?: number;
    db_only?: number;
    error?: string;
  };
  rows: PriceUpdateRow[];
  db_only_rows: Array<{
    sku: string;
    name: string;
    product_id: string;
    old_price: number;
    new_price: null;
    status: 'db_only';
  }>;
}

export interface ApplyPriceUpdateResponse {
  updated: Array<{ sku: string; old_price: number; new_price: number }>;
  skipped: Array<{ sku: string; reason: string }>;
  failed: Array<{ sku: string; reason: string }>;
}

export async function uploadPriceListPdf(
  file: File,
  brand: string,
  token: string
): Promise<PriceUpdateUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('brand', brand);

  const res = await fetch(`${API_BASE}/api/admin/price-updates/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload price list');
  }
  return res.json();
}

export async function getPriceUpdateProgress(
  jobId: string,
  token: string
): Promise<PriceUpdateProgressResponse> {
  const res = await fetch(`${API_BASE}/api/admin/price-updates/${jobId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch price update progress');
  return res.json();
}

export async function getPriceUpdatePreview(
  jobId: string,
  token: string
): Promise<PriceUpdatePreviewResponse> {
  const res = await fetch(`${API_BASE}/api/admin/price-updates/${jobId}/preview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch price update preview');
  return res.json();
}

export async function applyPriceUpdates(
  jobId: string,
  selectedSkus: string[],
  priceOverrides: Record<string, number>,
  token: string
): Promise<ApplyPriceUpdateResponse> {
  const res = await fetch(`${API_BASE}/api/admin/price-updates/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      selected_skus: selectedSkus,
      price_overrides: priceOverrides,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to apply price updates');
  }
  return res.json();
}

