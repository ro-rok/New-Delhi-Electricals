import type { Product } from '@/types/product';
import { findHub } from '@/lib/commercialHubs';

export const SITE_URL = 'https://www.newdelhielectricals.com';
export const DEFAULT_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

export type RouteKind = 'home' | 'static' | 'category' | 'brand' | 'hub' | 'product' | 'utility' | 'not-found';

/** A named group of crawlable internal links rendered under the page body. */
export interface RouteLinkGroup { heading: string; items: Array<{ label: string; path: string }> }

export interface RouteData {
  kind: RouteKind;
  path: string;
  title: string;
  description: string;
  robots?: string;
  heading: string;
  text?: string;
  category?: { slug: string; name: string; description: string };
  brand?: { slug: string; name: string; description?: string };
  /** Reference into COMMERCIAL_HUBS; the hub body itself is static and shared, not serialised. */
  hub?: { brandSlug: string; slug: string };
  product?: Product;
  /** Active product records explicitly linked by the catalogue's variant map. */
  variantOptions?: Array<{ sku: string; name: string; color: string; urlPath: string }>;
  products?: Product[];
  /** Short factual statements shown above the fold on commercial landing pages. */
  propositions?: string[];
  links?: RouteLinkGroup[];
  /** Complete crawlable listing for a category, so no catalogue product is left unlinked. */
  catalogIndex?: { heading: string; groups: RouteLinkGroup[] };
}

export interface RouteMetadata {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  image: string;
  type: 'website' | 'product';
  schema: Record<string, unknown>[];
}

export function slugify(value = ''): string {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path === '/' ? '/' : path.split('?')[0]}`;
}

function breadcrumb(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path),
    })),
  };
}

const organisation = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'New Delhi Electricals', url: `${SITE_URL}/`,
  telephone: '+91-9654102758',
  address: { '@type': 'PostalAddress', streetAddress: '30 A Corner Market, Malviya Nagar', addressLocality: 'New Delhi', postalCode: '110017', addressCountry: 'IN' },
  areaServed: 'Delhi NCR', openingHours: 'Mo-Su 10:00-19:30',
};

/** Shared, deterministic metadata model for SSR and browser hydration. */
export function getRouteMetadata(data: RouteData): RouteMetadata {
  const canonical = canonicalUrl(data.path);
  const schema: Record<string, unknown>[] = [];
  if (data.kind === 'home') schema.push(organisation);
  if (data.kind === 'category' && data.category) schema.push(breadcrumb([
    { name: 'Home', path: '/' }, { name: 'Categories', path: '/categories' }, { name: data.category.name, path: data.path },
  ]));
  if (data.kind === 'brand' && data.brand) schema.push(breadcrumb([
    { name: 'Home', path: '/' }, { name: 'Brands', path: '/brands' }, { name: data.brand.name, path: data.path },
  ]));
  if (data.kind === 'hub' && data.hub) {
    const hub = findHub(data.hub.brandSlug, data.hub.slug);
    if (hub) {
      schema.push(breadcrumb([
        { name: 'Home', path: '/' }, { name: 'Brands', path: '/brands' },
        { name: hub.brandName, path: `/brand/${hub.brandSlug}` }, { name: hub.categoryName, path: data.path },
      ]));
      // The visible page is the product list this describes; no offers or availability are claimed.
      if (data.products?.length) schema.push({
        '@context': 'https://schema.org', '@type': 'ItemList', name: hub.heading, url: canonical,
        numberOfItems: data.products.length,
        itemListElement: data.products.map((product, index) => ({
          '@type': 'ListItem', position: index + 1, name: product.name,
          url: canonicalUrl(product.urlPath || `/${product.brandSlug}/${product.slug}`),
        })),
      });
    }
  }
  if (data.kind === 'product' && data.product) {
    const product = data.product;
    schema.push({
      '@context': 'https://schema.org', '@type': 'Product', name: product.name,
      ...(product.description ? { description: product.description } : {}),
      ...(product.sku ? { sku: String(product.sku) } : {}),
      ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
      ...(product.category ? { category: product.category } : {}),
      ...(product.images?.length ? { image: product.images } : {}), url: canonical,
    });
    schema.push(breadcrumb([
      { name: 'Home', path: '/' },
      { name: data.category?.name || 'Categories', path: data.category ? `/category/${data.category.slug}` : '/categories' },
      { name: product.brand, path: `/brand/${slugify(product.brand)}` }, { name: product.name, path: data.path },
    ]));
  }
  return {
    title: data.title, description: data.description, canonical, robots: data.robots || 'index, follow',
    image: data.product?.images?.[0] || DEFAULT_IMAGE, type: data.kind === 'product' ? 'product' : 'website', schema,
  };
}

export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
