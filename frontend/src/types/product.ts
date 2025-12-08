export interface CatalogSourcePricing {
  mrp: number;
  discount: number | null;
  selling_price: number | null;
  std_pack: string;
}

export interface CatalogSourceSEO {
  keywords: string[];
  meta_description: string;
  slug: string;
}

export interface CatalogSource {
  source_file?: string;
  subcategory?: string;
  product_family: string;
  variant?: string[];
  pricing?: CatalogSourcePricing;
  seo?: CatalogSourceSEO;
  highlights?: any[];
}

export interface ProductStatus {
  is_active: boolean;
  is_featured?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  series: string;
  listPrice: number;
  currency: string;
  images: string[];
  datasheetUrl?: string;
  specs: Record<string, string | number | boolean | null>;
  description: string;
  badge?: 'popular' | 'best-value' | 'new';
  slug?: string;
  comingSoon?: boolean;
  isActive: boolean;
  status?: ProductStatus;
  catalogSource: CatalogSource;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  catalogUrl?: string;
  featured: boolean;
  productCount?: number;
}

export interface Inquiry {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  productSku?: string;
  message: string;
  attachments?: string[];
  createdAt: Date;
}
