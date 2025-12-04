import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate product URL using slug-based format: /product/:brand/:product_family/:slug
 * Falls back to generated slug or ID-based format if slug is not available
 */
export function getProductUrl(product: Product): string {
  // Extract slug from product (could be in slug field, catalogSource, or specs)
  const slug = product.slug || 
               product.catalogSource?.slug || 
               product.catalogSource?.seo?.slug ||
               (product.specs && 'slug' in product.specs ? product.specs.slug : null) ||
               null;
  
  // If slug is available, use slug-based URL
  if (slug) {
    const brandSlug = product.brand.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    const familySlug = product.series.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '') || 'product';
    return `/product/${brandSlug}/${familySlug}/${slug}`;
  }
  
  // Generate slug from product name as fallback
  const generatedSlug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || product.sku.toLowerCase().replace(/\s+/g, '-');
  
  const brandSlug = product.brand.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
  const familySlug = product.series.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '') || 'product';
  
  return `/product/${brandSlug}/${familySlug}/${generatedSlug}`;
}
