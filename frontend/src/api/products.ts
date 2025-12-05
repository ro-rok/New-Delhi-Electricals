import { Product, Category, Brand } from '@/types/product';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

// Transform backend product to frontend product format
function transformProduct(backendProduct: any): Product {
  // Handle both ProductInDB format (list_price, images array) and full Product schema format (pricing.mrp, media.images)
  const listPrice = backendProduct.list_price || backendProduct.pricing?.mrp || 0;
  const images = backendProduct.images || 
    (backendProduct.media?.images?.map((img: any) => typeof img === 'string' ? img : img.url) || []);
  const datasheetUrl = backendProduct.datasheet_url || backendProduct.media?.documents?.[0];
  const description = backendProduct.description || backendProduct.seo?.meta_description || '';
  const series = backendProduct.series || backendProduct.product_family || '';
  
  // Extract slug from multiple possible locations
  const slug = backendProduct.seo?.slug || 
               backendProduct.catalog_source?.slug || 
               backendProduct.specs?.slug || 
               backendProduct.slug ||
               null;
  
  return {
    id: backendProduct._id || backendProduct.id || backendProduct.sku,
    sku: backendProduct.sku,
    name: backendProduct.name,
    brand: backendProduct.brand,
    category: backendProduct.category,
    subcategory: backendProduct.subcategory || backendProduct.catalog_source?.subcategory,
    series: series,
    listPrice: typeof listPrice === 'number' ? listPrice : parseInt(String(listPrice), 10) || 0,
    currency: backendProduct.currency || 'INR',
    images: images,
    datasheetUrl: datasheetUrl,
    specs: transformSpecs(backendProduct.specs),
    description: description,
    badge: backendProduct.status?.is_featured || backendProduct.badge ? 'popular' : undefined,
    slug: slug,
    catalogSource: backendProduct.catalog_source,
  };
}

function transformSpecs(specs: any): Record<string, string> {
  if (!specs) return {};
  const result: Record<string, string> = {};
  Object.keys(specs).forEach(key => {
    const value = specs[key];
    if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  });
  return result;
}

export async function getProducts(params?: {
  q?: string;
  category?: string;
  brand?: string;
  series?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.append('q', params.q);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.brand) searchParams.append('brand', params.brand);
  if (params?.series) searchParams.append('series', params.series);
  if (params?.minPrice !== undefined) searchParams.append('min_price', String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.append('max_price', String(params.maxPrice));
  if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
  if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));

  const url = `${API_BASE}/api/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  return {
    items: data.items.map(transformProduct),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return transformProduct(data);
  } catch {
    return null;
  }
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const response = await getProducts({ q: sku, pageSize: 1 });
  return response.items.find(p => p.sku === sku) || null;
}

export async function getProductBySlug(
  brand: string,
  productFamily: string,
  slug: string
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/slug/${slug}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const product = transformProduct(data);
    
    // Verify brand and product_family match
    const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
    const productBrandSlug = product.brand.toLowerCase().replace(/\s+/g, '-');
    const productFamilySlug = productFamily.toLowerCase().replace(/\s+/g, '-');
    const productSeriesSlug = product.series.toLowerCase().replace(/\s+/g, '-');
    
    if (productBrandSlug !== brandSlug || productSeriesSlug !== productFamilySlug) {
      // Brand or product family doesn't match, return null
      return null;
    }
    
    return product;
  } catch {
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  const response = await getProducts({ q: query, pageSize: 100 });
  return response.items;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  // Use backend filtering for better performance
  const response = await getProducts({ category, pageSize: 1000 });
  return response.items;
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  // Use backend filtering for better performance
  const response = await getProducts({ brand, pageSize: 1000 });
  return response.items;
}

export async function getFeaturedProducts(brand?: string): Promise<Product[]> {
  const response = await getProducts({ pageSize: 100 });
  let filtered = response.items.filter(p => p.badge);
  if (brand) {
    filtered = filtered.filter(p => p.brand === brand);
  }
  return filtered.slice(0, 5);
}

// Categories and brands fetched from backend
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products/categories`);
    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status, res.statusText);
      throw new Error('Failed to fetch categories');
    }
    const data = await res.json();
    console.log('Categories fetched from backend:', data);
    return data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      image: cat.image,
      productCount: cat.productCount,
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products/brands`);
    if (!res.ok) {
      throw new Error('Failed to fetch brands');
    }
    const data = await res.json();
    return data.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: brand.description,
      featured: brand.featured || false,
      productCount: brand.productCount,
    }));
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    return [];
  }
}

