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

