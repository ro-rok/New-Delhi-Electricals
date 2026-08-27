/**
 * Category Utilities
 *
 * Provides functions for fetching and merging products from multiple
 * DB categories into a single shopping category view.
 */

import { getProducts, ProductListResponse } from '@/api/products';
import { Product } from '@/types/product';
import {
  SHOPPING_CATEGORIES,
  ShoppingCategory,
  getShoppingCategory,
  getDbCategoriesForShoppingCategory,
} from '@/config/shoppingCategories';

/**
 * Fetch all products for a shopping category by querying each constituent DB category
 * and merging the results. This handles the multi-category → single-view mapping.
 */
export async function fetchProductsForShoppingCategory(
  shoppingSlug: string,
  options?: {
    pageSize?: number;
    brand?: string;
    series?: string;
    subcategory?: string;
    q?: string;
    sortBy?: 'name' | 'price';
    sortOrder?: 'asc' | 'desc';
    page?: number;
  }
): Promise<ProductListResponse> {
  const dbCategories = getDbCategoriesForShoppingCategory(shoppingSlug);

  if (dbCategories.length === 0) {
    return { items: [], total: 0, page: 1, pageSize: options?.pageSize ?? 20 };
  }

  // If only one DB category, use the standard endpoint
  if (dbCategories.length === 1) {
    return getProducts({
      category: dbCategories[0],
      pageSize: options?.pageSize ?? 2000,
      brand: options?.brand,
      series: options?.series,
      subcategory: options?.subcategory,
      q: options?.q,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      page: options?.page,
    });
  }

  // For multiple DB categories, fetch from each and merge
  const fetchPromises = dbCategories.map(dbCat =>
    getProducts({
      category: dbCat,
      pageSize: 2000,
      brand: options?.brand,
      series: options?.series,
      subcategory: options?.subcategory,
      q: options?.q,
    }).catch(err => {
      console.error(`Failed to fetch category ${dbCat}:`, err);
      return { items: [], total: 0, page: 1, pageSize: 2000 };
    })
  );

  const results = await Promise.all(fetchPromises);

  // Merge all items
  let allItems: Product[] = [];
  let totalCount = 0;
  for (const result of results) {
    allItems.push(...result.items);
    totalCount += result.total;
  }

  // Apply sorting
  if (options?.sortBy === 'price') {
    allItems.sort((a, b) =>
      options.sortOrder === 'desc'
        ? b.listPrice - a.listPrice
        : a.listPrice - b.listPrice
    );
  } else {
    // Default: sort by name ascending
    allItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Apply pagination
  const pageSize = options?.pageSize ?? 20;
  const page = options?.page ?? 1;
  const start = (page - 1) * pageSize;
  const pagedItems = allItems.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total: totalCount,
    page,
    pageSize,
  };
}

/**
 * Filter products by sub-section DB categories
 */
export function filterProductsBySubSection(
  products: Product[],
  subSectionDbCategories: string[]
): Product[] {
  return products.filter(p => subSectionDbCategories.includes(p.category));
}

/**
 * Get product count for each sub-section within a shopping category
 */
export function getSubSectionCounts(
  allProducts: Product[],
  shoppingSlug: string
): Record<string, number> {
  const cat = getShoppingCategory(shoppingSlug);
  if (!cat) return {};

  const counts: Record<string, number> = {};
  for (const sub of cat.subSections) {
    counts[sub.id] = allProducts.filter(p =>
      sub.dbCategories.includes(p.category)
    ).length;
  }
  return counts;
}

/**
 * Get the next category in the shopping flow
 */
export function getNextShoppingCategory(currentSlug: string): ShoppingCategory | undefined {
  const current = getShoppingCategory(currentSlug);
  if (!current?.nextStepSlug) return undefined;
  return getShoppingCategory(current.nextStepSlug);
}

/**
 * Filter products by a subcategory name (case-insensitive match on product.subcategory).
 * Used for sub-section tabs like "MCBs" or "RCCBs" that map to subcategory values.
 */
export function filterBySubcategory(products: Product[], subcategoryHint: string): Product[] {
  const hint = subcategoryHint.toLowerCase();
  return products.filter(p => {
    const subcat = (p.subcategory || '').toLowerCase();
    return subcat.includes(hint);
  });
}
