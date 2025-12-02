import type { Product } from '@/types/product';

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

export interface MockParseResponse {
  importId: string;
  fileName: string;
  rows: ParsedRow[];
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function mockParseCatalog(): Promise<MockParseResponse> {
  const res = await fetch(`${API_BASE}/parse/mock`);
  if (!res.ok) {
    throw new Error('Failed to fetch parsed catalog');
  }
  const data = await res.json();
  return {
    importId: data.import_id ?? data.importId ?? 'mock-import-1',
    fileName: data.file_name ?? data.fileName ?? 'catalog.pdf',
    rows: (data.rows ?? []).map((row: any) => ({
      tempId: String(row.temp_id ?? row.tempId ?? row.id ?? ''),
      sku: row.sku ?? '',
      name: row.name ?? '',
      brand: row.brand,
      category: row.category,
      series: row.series ?? '',
      listPrice: Number(row.list_price ?? row.listPrice ?? 0),
      currency: row.currency ?? 'INR',
      page: Number(row.page ?? row.page_no ?? 0),
      confidence: Number(row.confidence ?? 0),
      imageUrl: row.image_url ?? row.imageUrl,
    })),
  };
}


