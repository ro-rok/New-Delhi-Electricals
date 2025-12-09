import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate product URL using slug-based format: /product/:brand/:product_family/:slug
 * Falls back to generated slug or ID-based format if slug is not available
 */
export function getProductUrl(product: Product): string {
  // Prefer backend-provided url_path (already includes leading slash)
  const providedPath = (product as any).url_path || product.urlPath;
  if (providedPath) {
    return providedPath.startsWith("/") ? providedPath : `/${providedPath}`;
  }

  // Extract slug from top-level field only
  const slug = product.slug || null;

  // Generate slug from product name as fallback
  const finalSlug =
    slug ||
    slugify(product.name) ||
    slugify(product.sku) ||
    "product";

  const brandSlug = product.brandSlug || slugify(product.brand);

  if (brandSlug && finalSlug) {
    return `/${brandSlug}/${finalSlug}`;
  }

  return `/product/${product.id}`;
}
