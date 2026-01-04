import { Product, Category, Brand } from '@/types/product';
import { slugify } from '@/lib/utils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

function normalizeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  try {
    const parsed = new URL(url);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (isLocalHost && API_BASE) {
      return `${API_BASE}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return url;
  } catch {
    // Relative path (e.g. public/catalog_images/foo.jpg or /public/...)
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${path}`;
  }
}

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
  const rawImages = backendProduct.images ||
    (backendProduct.media?.images?.map((img: any) => typeof img === 'string' ? img : img.url) || []);
  const images = (rawImages || [])
    .map((url: string) => normalizeMediaUrl(url))
    .filter((url: string | null): url is string => Boolean(url));

  const datasheetUrl = normalizeMediaUrl(
    backendProduct.datasheet_url || backendProduct.media?.documents?.[0]
  ) || undefined;

  // Prefer explicit description, then fall back to SEO meta description
  let description = backendProduct.description || backendProduct.seo?.meta_description || '';

  // Wires meta cleanup: remove in-text SKU mention and "inverter" from the tail phrase
  if (description) {
    // Drop patterns like " (SKU ABC-123)" inside the sentence
    description = description.replace(/\s*\(SKU [^)]+\)/gi, '');
    // Simplify "...residential and inverter wiring." -> "...residential wiring."
    description = description.replace(/residential and inverter wiring\./gi, 'residential wiring.');
  }
  const product_family = backendProduct.product_family || backendProduct.series || '';

  const brandSlug = backendProduct.brand_slug || slugify(backendProduct.brand);
  const sourceFile = backendProduct._source_file || backendProduct.source_file;

  // Extract slug from top-level field only
  const slug = backendProduct.slug || null;

  const status = backendProduct.status || {};
  const isActive = status.is_active !== false;
  const isFeatured = status.is_featured === true;

  const urlPath = backendProduct.url_path || (brandSlug && slug ? `/${brandSlug}/${slug}` : undefined);

  // Extract variant field (maps SKU -> Color Name) - it's at top level
  const variant = backendProduct.variant || undefined;
  
  // Only log variant extraction in development if needed (commented out to reduce noise)
  // console.log('Transform product variant extraction:', {
  //   'backendProduct.variant': backendProduct.variant,
  //   'final variant': variant,
  // });


  // Extract discount from catalog_source.pricing.discount
  const discount = backendProduct.catalog_source?.pricing?.discount ??
                   backendProduct.pricing?.discount ??
                   null;
  return {
    id: backendProduct._id || backendProduct.id || backendProduct.sku,
    sku: backendProduct.sku,
    name: backendProduct.name,
    brand: backendProduct.brand,
    brandSlug,
    sourceFile,
    category: backendProduct.category,
    subcategory: backendProduct.subcategory,
    series: backendProduct.series ?? backendProduct.product_family ?? '',
    product_family: product_family,
    listPrice: typeof listPrice === 'number' ? listPrice : parseInt(String(listPrice), 10) || 0,
    discount: typeof discount === 'number' ? discount : null,
    currency: backendProduct.currency || 'INR',
    images: images,
    datasheetUrl: datasheetUrl,
    specs: transformSpecs(backendProduct.specs),
    description: description,
    badge: isFeatured || backendProduct.badge ? 'popular' : undefined,
    slug: slug,
    urlPath,
    comingSoon: backendProduct.status?.coming_soon || backendProduct.comingSoon || false,
    isActive: isActive,
    status: status,
    variant: variant,
  };
}

function transformSpecs(specs: Record<string, unknown> | null | undefined): Record<string, string | number | boolean | null> {
  if (!specs) return {};
  const result: Record<string, string | number | boolean | null> = {};
  Object.entries(specs).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value as string | number | boolean | null;
    } else if (value && typeof value === 'object' && '$numberDouble' in value) {
      const num = parseFloat((value as any)['$numberDouble']);
      result[key] = Number.isNaN(num) ? null : num;
    } else {
      result[key] = String(value);
    }
  });
  return result;
}


export async function getProducts(params?: {
  q?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  series?: string;
  productFamily?: string;
  color?: string;
  moduleSize?: string;
  wireSize?: number;
  coreCount?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  missingImages?: boolean;
}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.append('q', params.q);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.subcategory) searchParams.append('subcategory', params.subcategory);
  if (params?.brand) searchParams.append('brand', params.brand);
  if (params?.series) searchParams.append('series', params.series);
  if (params?.productFamily) searchParams.append('product_family', params.productFamily);
  if (params?.color) searchParams.append('color', params.color);
  if (params?.moduleSize) searchParams.append('moduleSize', params.moduleSize);
  if (params?.wireSize !== undefined) searchParams.append('wireSize', String(params.wireSize));
  if (params?.coreCount !== undefined) searchParams.append('coreCount', String(params.coreCount));
  if (params?.minPrice !== undefined) searchParams.append('min_price', String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.append('max_price', String(params.maxPrice));
  if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
  if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  if (params?.isActive !== undefined) searchParams.append('is_active', String(params.isActive));
  if (params?.missingImages !== undefined) searchParams.append('missingImages', String(params.missingImages));

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
  slug: string
): Promise<Product | null> {
  try {
    const brandSegment = slugify(brand);

    // Try brand + slug endpoint first
    const resBrand = await fetch(`${API_BASE}/api/products/brand/${brandSegment}/${slug}`);
    if (resBrand.ok) {
      const data = await resBrand.json();
      return transformProduct(data);
    }

    // Fallback to legacy slug-only endpoint
    const res = await fetch(`${API_BASE}/api/products/slug/${slug}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return transformProduct(data);
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

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<Product> {
  // Transform frontend Product format to backend ProductUpdate format
  const updatePayload: any = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.brand !== undefined) updatePayload.brand = data.brand;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.series !== undefined) updatePayload.series = data.series;
  if (data.listPrice !== undefined) updatePayload.list_price = data.listPrice;
  if (data.currency !== undefined) updatePayload.currency = data.currency;
  if (data.images !== undefined) updatePayload.images = data.images;
  if (data.datasheetUrl !== undefined) updatePayload.datasheet_url = data.datasheetUrl;
  if (data.specs !== undefined) updatePayload.specs = data.specs;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.comingSoon !== undefined) {
    // Store coming_soon in a status object to match backend schema
    updatePayload.status = updatePayload.status || {};
    updatePayload.status.coming_soon = data.comingSoon;
  }
  if (data.isActive !== undefined) {
    updatePayload.status = updatePayload.status || {};
    updatePayload.status.is_active = data.isActive;
  }

  // Get auth token for authenticated requests
  const token = localStorage.getItem('admin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updatePayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update product');
  }

  const updatedProduct = await res.json();
  return transformProduct(updatedProduct);
}

// Cloudinary upload functions
export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  resourceType: string;
  signature: string;
}

export async function getCloudinarySignature(): Promise<CloudinarySignature> {
  // Get auth token from localStorage (admin_token is used in this app)
  const token = localStorage.getItem('admin_token');

  if (!token) {
    console.error('No admin_token found in localStorage');
    throw new Error('Not authenticated. Please log in again.');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/cloudinary/signature`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies for auth
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Clear invalid token
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_auth');
        console.error('Authentication failed - token may be expired');
        throw new Error('Not authenticated. Please log in again.');
      }
      const errorData = await res.json().catch(() => ({}));
      console.error('Failed to get Cloudinary signature:', {
        status: res.status,
        statusText: res.statusText,
        error: errorData
      });
      throw new Error(errorData.detail || `Failed to get Cloudinary signature (${res.status})`);
    }

    return res.json();
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error.message?.includes('Not authenticated')) {
      throw error;
    }
    // Otherwise wrap it
    console.error('Error fetching Cloudinary signature:', error);
    throw new Error(error.message || 'Failed to get Cloudinary signature');
  }
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  try {
    // Get signature from backend
    const signature = await getCloudinarySignature();

    // Create form data for Cloudinary upload
    // Important: Only include parameters that were used in signature calculation
    // For image uploads, backend only signs: timestamp and folder (resource_type is excluded)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('folder', signature.folder);
    // Note: resource_type is NOT included in form data for image uploads
    // as it's not part of the signature when resource_type="image"
    formData.append('signature', signature.signature);

    // Upload to Cloudinary
    // Use the resource_type from signature, default to 'image'
    const resourceType = signature.resourceType || 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`;

    const uploadRes = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.json().catch(() => ({ error: { message: 'Unknown error' } }));
      const errorMessage = error.error?.message || error.message || `Failed to upload image (${uploadRes.status})`;
      console.error('Cloudinary upload error:', {
        status: uploadRes.status,
        statusText: uploadRes.statusText,
        error,
        signature: {
          cloudName: signature.cloudName,
          timestamp: signature.timestamp,
          folder: signature.folder,
          resourceType: signature.resourceType,
        }
      });
      throw new Error(errorMessage);
    }

    const result = await uploadRes.json();
    return result.secure_url;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    // Re-throw with a more user-friendly message if it's an authentication error
    if (error.message?.includes('Not authenticated')) {
      throw error;
    }
    throw new Error(error.message || 'Failed to upload image to Cloudinary');
  }
}

// Bulk update products
export async function bulkUpdateProducts(
  productIds: string[],
  data: Partial<Product>
): Promise<void> {
  // Transform frontend Product format to backend ProductUpdate format
  const updatePayload: any = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.brand !== undefined) updatePayload.brand = data.brand;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.series !== undefined) updatePayload.series = data.series;
  if (data.listPrice !== undefined) updatePayload.list_price = data.listPrice;
  if (data.currency !== undefined) updatePayload.currency = data.currency;
  if (data.images !== undefined) updatePayload.images = data.images;
  if (data.datasheetUrl !== undefined) updatePayload.datasheet_url = data.datasheetUrl;
  if (data.specs !== undefined) updatePayload.specs = data.specs;
  if (data.description !== undefined) updatePayload.description = data.description;

  // Update products in parallel
  const updatePromises = productIds.map(id =>
    updateProduct(id, data).catch(error => {
      console.error(`Failed to update product ${id}:`, error);
      throw error;
    })
  );

  await Promise.all(updatePromises);
}

