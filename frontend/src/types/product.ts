
export interface ProductStatus {
  is_active: boolean;
  is_featured?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  brandSlug?: string;
  sourceFile?: string;
  category: string;
  subcategory?: string;
  product_family: string;
  listPrice: number;
  currency: string;
  images: string[];
  datasheetUrl?: string;
  specs: Record<string, string | number | boolean | null>;
  description: string;
  badge?: 'popular' | 'best-value' | 'new';
  slug?: string;
  urlPath?: string;
  comingSoon?: boolean;
  isActive: boolean;
  status?: ProductStatus;
  highlights?: any[];
  variant?: Record<string, string>; // Maps SKU -> Color Name
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
