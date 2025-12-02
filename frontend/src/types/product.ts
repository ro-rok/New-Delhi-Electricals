export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  series: string;
  listPrice: number;
  currency: string;
  images: string[];
  datasheetUrl?: string;
  specs: Record<string, string>;
  description: string;
  badge?: 'popular' | 'best-value' | 'new';
  catalogSource?: {
    file: string;
    page: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  catalogUrl?: string;
  featured: boolean;
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
