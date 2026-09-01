import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, '..');
const REPO_DIR = path.resolve(FRONTEND_DIR, '..');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const SERVER_ENTRY = path.join(DIST_DIR, 'server', 'entry-server.js');
const FALLBACK_DATA_PATH = path.join(REPO_DIR, 'backend', 'app', 'parsing', 'output', 'all_products_full.json');
const SITE_URL = 'https://www.newdelhielectricals.com';
const ALLOW_FALLBACK = process.env.SEO_ALLOW_CATALOG_FALLBACK === 'true';
const NOINDEX_PATHS = ['/search', '/cart', '/shortlist', '/compare'];
const STATIC_PATHS = ['/', '/about', '/services', '/contact', '/faq', '/categories', '/brands'];

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeMediaUrl(url) {
  if (!url) return null;
  if (/^(?:https?:|data:)/.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function normaliseProduct(raw) {
  const brand = raw.brand || '';
  const slug = raw.slug || raw.catalog_source?.seo?.slug || null;
  const brandSlug = raw.brand_slug || slugify(brand);
  const images = (raw.images || raw.media?.images?.map((image) => typeof image === 'string' ? image : image.url) || []).map(normalizeMediaUrl).filter(Boolean);
  const status = raw.status || {};
  return {
    id: String(raw._id || raw.id || raw.sku || ''), sku: String(raw.sku || ''), name: raw.name || '', brand, brandSlug,
    sourceFile: raw._source_file || raw.source_file, category: raw.category || '', subcategory: raw.subcategory,
    series: raw.series || raw.product_family || '', product_family: raw.product_family || raw.series || '',
    listPrice: Number(raw.list_price || raw.pricing?.mrp || 0),
    discount: typeof (raw.catalog_source?.pricing?.discount ?? raw.pricing?.discount) === 'number' ? (raw.catalog_source?.pricing?.discount ?? raw.pricing?.discount) : null,
    currency: raw.currency || 'INR', images, datasheetUrl: normalizeMediaUrl(raw.datasheet_url || raw.media?.documents?.[0]) || undefined,
    specs: raw.specs || {}, description: raw.description || raw.seo?.meta_description || '', badge: status.is_featured || raw.badge ? 'popular' : undefined,
    slug, urlPath: raw.url_path || (brandSlug && slug ? `/${brandSlug}/${slug}` : undefined), comingSoon: status.coming_soon || raw.comingSoon || false,
    isActive: status.is_active !== false, status, variant: raw.variant ? Object.fromEntries(Object.entries(raw.variant).slice(0, 24)) : undefined,
  };
}

function isValidRoutePath(value) {
  return typeof value === 'string' && /^\/[a-z0-9][a-z0-9/-]*$/i.test(value) && !value.includes('//') && !value.includes('..');
}

function exclusionFor(product) {
  if (!product.isActive) return 'inactive/malformed record';
  if (!product.name) return 'missing name';
  if (!product.brand) return 'missing brand';
  if (!product.urlPath) return 'missing slug';
  if (!isValidRoutePath(product.urlPath)) return 'invalid URL';
  return null;
}

function fallbackMetadata() {
  const contents = fs.readFileSync(FALLBACK_DATA_PATH);
  const stats = fs.statSync(FALLBACK_DATA_PATH);
  return { file: path.relative(REPO_DIR, FALLBACK_DATA_PATH).replaceAll('\\', '/'), modifiedAt: stats.mtime.toISOString(), sha256: crypto.createHash('sha256').update(contents).digest('hex') };
}

function deriveBrands(products) {
  return [...new Map(products.map((product) => [product.brandSlug, { id: product.brandSlug, name: product.brand, slug: product.brandSlug, logo: '', description: `${product.brand} electrical products available from New Delhi Electricals.`, featured: false, productCount: products.filter((item) => item.brandSlug === product.brandSlug).length }])).values()].sort((a, b) => a.name.localeCompare(b.name));
}

function deriveCategories(products) {
  return [...new Map(products.map((product) => [product.category, { id: slugify(product.category), name: product.category, slug: slugify(product.category), description: '', icon: '', productCount: products.filter((item) => item.category === product.category).length }])).values()];
}

// Keep the generated category page's initial product set in the same order as
// CategoryPage. This allows its background API revalidation to extend the
// catalogue without swapping the first visible products after hydration.
function categorySortPriority(product) {
  const category = String(product.category || '').toLowerCase();
  const name = String(product.name || '').toLowerCase();
  const rawAmpere = String(product.specs?.ampere ?? '').trim();
  const ampere = Number.parseFloat(rawAmpere.match(/^\d+(?:\.\d+)?/)?.[0] || '0');
  const isMiniMCB = name.includes('mini mcb') || name.includes('mini-mcb') || (name.includes('mcb') && !name.includes('switch'));
  let categoryPriority = 100;
  if (category === 'switches' && !isMiniMCB) categoryPriority = 0;
  else if (category === 'power sockets') categoryPriority = 10;
  else if (category === 'fan controls') categoryPriority = 20;
  else if (category === 'dimmers') categoryPriority = 25;
  else if (category === 'data sockets') categoryPriority = 35;
  else if (isMiniMCB) categoryPriority = 40;
  else if (category === 'accessories' || category === 'hospitality') categoryPriority = 50;
  const amperePriority = ampere <= 6 ? 0 : ampere <= 10 ? 1 : ampere <= 16 ? 2 : ampere <= 20 ? 3 : ampere <= 25 ? 4 : ampere <= 32 ? 5 : ampere <= 40 ? 6 : 7;
  const rawModule = product.specs?.mw ?? product.specs?.module_size ?? '';
  const moduleSize = typeof rawModule === 'number' ? rawModule : Number.parseFloat(String(rawModule).trim().match(/^\d+(?:\.\d+)?/)?.[0] || '0');
  const modulePriority = moduleSize <= 1 ? 0 : moduleSize <= 2 ? 1 : moduleSize <= 3 ? 2 : moduleSize <= 4 ? 3 : moduleSize <= 6 ? 4 : moduleSize <= 8 ? 5 : 6;
  let typePriority = 0;
  if (category === 'switches' && !isMiniMCB) {
    if (name.includes('2-way') || name.includes('two way')) typePriority = 1;
    if (name.includes('indicator')) typePriority = 2;
    if (name.includes('soft feel') || name.includes('softfeel')) typePriority = 3;
    if (name.includes('dp switch')) typePriority = 4;
    if (name.includes('mega') || name.includes('2 module')) typePriority = 5;
    if (name.includes('motor starter')) typePriority = 6;
    if (name.includes('wi-fi') || name.includes('wifi')) typePriority = 7;
    if (name.includes('ir ')) typePriority = 8;
  }
  return categoryPriority * 10000 + amperePriority * 1000 + modulePriority * 100 + typePriority * 10;
}

function compareProductNames(left, right) {
  const a = String(left.name || '').toLowerCase();
  const b = String(right.name || '').toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  const leftKey = String(left.urlPath || left.sku || left.id || '');
  const rightKey = String(right.urlPath || right.sku || right.id || '');
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function initialCategoryProducts(categorySlug, categoryProducts) {
  const sorted = [...categoryProducts];
  if (categorySlug === 'switches-sockets' || categorySlug === 'plates') {
    sorted.sort((a, b) => categorySortPriority(a) - categorySortPriority(b) || compareProductNames(a, b));
  } else {
    sorted.sort(compareProductNames);
  }
  return sorted.slice(0, 20);
}

async function loadCatalogue() {
  const envPath = path.join(FRONTEND_DIR, '.env.production');
  const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const apiUrl = process.env.VITE_API_BASE_URL || envFile.match(/^VITE_API_BASE_URL=(.+)$/m)?.[1]?.trim();
  let apiError;
  if (apiUrl) {
    try {
      const api = apiUrl.replace(/\/$/, '');
      const [productsResponse, brandsResponse, categoriesResponse] = await Promise.all([
        fetch(`${api}/api/products?pageSize=10000&is_active=true`, { signal: AbortSignal.timeout(60000) }),
        fetch(`${api}/api/products/brands`, { signal: AbortSignal.timeout(60000) }),
        fetch(`${api}/api/products/categories`, { signal: AbortSignal.timeout(60000) }),
      ]);
      if (!productsResponse.ok) throw new Error(`products HTTP ${productsResponse.status}`);
      const payload = await productsResponse.json();
      if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error('API returned no products');
      const products = payload.items.map(normaliseProduct);
      const fallbackBrands = deriveBrands(products);
      const fallbackCategories = deriveCategories(products);
      const brands = brandsResponse.ok ? (await brandsResponse.json()).map((brand) => ({ id: brand.id || brand._id || brand.slug, name: brand.name, slug: brand.slug || slugify(brand.name), logo: brand.logo || '', description: brand.description || '', catalogUrl: brand.catalogUrl, featured: Boolean(brand.featured), productCount: brand.productCount })) : fallbackBrands;
      const categories = categoriesResponse.ok ? (await categoriesResponse.json()).map((category) => ({ id: category.id || category._id || category.slug, name: category.name, slug: category.slug || slugify(category.name), description: category.description || '', icon: category.icon || '', image: category.image, productCount: category.productCount })) : fallbackCategories;
      return { products, brands, categories, source: 'production API', apiUrl };
    } catch (error) { apiError = error; }
  }
  if (!ALLOW_FALLBACK) throw new Error(`SEO generation refused to use repository fallback: production catalogue API unavailable (${apiError?.message || 'VITE_API_BASE_URL is not configured'}). Set SEO_ALLOW_CATALOG_FALLBACK=true only for an intentionally reviewed fallback build.`);
  console.warn('\n*** SEO BUILD WARNING: using repository catalogue fallback; this output is not sourced from production. ***\n');
  const products = JSON.parse(fs.readFileSync(FALLBACK_DATA_PATH, 'utf8')).map(normaliseProduct);
  return { products, brands: deriveBrands(products), categories: deriveCategories(products), source: 'repository product export (explicit fallback)', fallback: fallbackMetadata(), apiUrl: apiUrl || null, apiError: apiError?.message || null };
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

function cleanTemplate(template) {
  return template.replace(/\s*<title>[\s\S]*?<\/title>/i, '').replace(/\s*<meta\s+(?:name|property)="(?:description|keywords|author|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, '').replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '').replace(/\s*<meta\s+name="robots"[^>]*>/gi, '');
}

function metadataHead(metadata) {
  if (!metadata) throw new Error('React route did not register SEO metadata.');
  const canonical = new URL(metadata.canonicalPath || '/', SITE_URL).toString();
  const image = metadata.image ? new URL(metadata.image, SITE_URL).toString() : undefined;
  const schemas = metadata.structuredData ? (Array.isArray(metadata.structuredData) ? metadata.structuredData : [metadata.structuredData]) : [];
  return [
    `<title>${escapeHtml(metadata.title)}</title>`, `<meta name="description" content="${escapeHtml(metadata.description)}">`, `<meta name="robots" content="${escapeHtml(metadata.robots || 'index, follow')}">`, `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}">`, `<meta property="og:description" content="${escapeHtml(metadata.description)}">`, `<meta property="og:type" content="${escapeHtml(metadata.type || 'website')}">`, `<meta property="og:url" content="${escapeHtml(canonical)}">`, '<meta property="og:site_name" content="New Delhi Electricals">',
    ...(image ? [`<meta property="og:image" content="${escapeHtml(image)}">`, `<meta property="og:image:secure_url" content="${escapeHtml(image)}">`, `<meta name="twitter:image" content="${escapeHtml(image)}">`] : []),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`, `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`, `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`, '<meta name="twitter:site" content="@newdelhielec">',
    ...schemas.map((schema) => `<script type="application/ld+json" data-seo-schema>${safeJson(schema)}</script>`),
  ].join('\n    ');
}

function htmlForRoute(template, appHtml, metadata, initialData) {
  return cleanTemplate(template).replace('</head>', `    ${metadataHead(metadata)}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n    <script>window.__NDE_INITIAL_ROUTE_DATA__=${safeJson(initialData)};</script>`);
}

function outputPathFor(routePath) { return routePath === '/' ? TEMPLATE_PATH : path.join(DIST_DIR, `${routePath.replace(/^\//, '')}.html`); }
function writeRoute(routePath, html) { const outputPath = outputPathFor(routePath); fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, html, 'utf8'); }

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const { render, COMMERCIAL_HUBS, selectHubProducts } = await import(pathToFileURL(SERVER_ENTRY).href);
const catalogue = await loadCatalogue();
const excludedProducts = catalogue.products.map((product) => ({ product, reason: exclusionFor(product) })).filter(({ reason }) => reason);
const routesByPath = new Map();
for (const product of catalogue.products.filter((item) => !exclusionFor(item))) {
  const key = product.urlPath.toLowerCase();
  if (routesByPath.has(key)) { excludedProducts.push({ product, reason: 'duplicate canonical' }); continue; }
  routesByPath.set(key, product);
}
const products = [...routesByPath.values()];
const brands = catalogue.brands.filter((brand) => products.some((product) => product.brandSlug === brand.slug));
const categories = catalogue.categories;
const routeSet = new Set();
const payloadSizes = {};

// Commercial hubs the catalogue can actually fill. A hub with no matching products is
// suppressed rather than shipped as an empty landing page.
function orderedHubProducts(hub) {
  return selectHubProducts(hub, products).slice().sort((a, b) => a.name.localeCompare(b.name));
}
const activeHubs = COMMERCIAL_HUBS
  .map((hub) => ({ hub, items: orderedHubProducts(hub) }))
  .filter((entry) => entry.items.length > 0);
const hubForPath = new Map(activeHubs.map((entry) => [`/brand/${entry.hub.brandSlug}/${entry.hub.slug}`, entry]));

function initialDataFor(pathname, product) {
  if (pathname === '/') {
    const featuredBrands = brands.filter((brand) => brand.featured).slice(0, 3);
    const selectedBrands = featuredBrands.length ? featuredBrands : brands.slice(0, 3);
    return { pathname, home: { featuredBrands: selectedBrands, featuredProducts: Object.fromEntries(selectedBrands.map((brand) => [brand.name, products.filter((item) => item.brand === brand.name && item.badge).slice(0, 5)])) } };
  }
  if (pathname === '/categories') return { pathname, categoryCounts: Object.fromEntries([['switches-sockets', ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality']], ['plates', ['Plates']], ['circuit-protection', ['Circuit Protection']], ['wires-cables', ['Wires & Cables']], ['boxes', ['Boxes']], ['geysers', ['geyser']]].map(([slug, names]) => [slug, products.filter((item) => names.includes(item.category)).length])) };
  if (pathname === '/brands') return { pathname, brands };
  if (pathname.startsWith('/category/')) {
    const categorySlug = pathname.slice('/category/'.length);
    const dbCategories = { 'switches-sockets': ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'], plates: ['Plates'], 'circuit-protection': ['Circuit Protection'], 'wires-cables': ['Wires & Cables'], boxes: ['Boxes'], geysers: ['geyser'] }[categorySlug] || [];
    return { pathname, products: initialCategoryProducts(categorySlug, products.filter((item) => dbCategories.includes(item.category))), brands };
  }
  if (hubForPath.has(pathname)) {
    return { pathname, products: hubForPath.get(pathname).items };
  }
  if (pathname.startsWith('/brand/')) {
    const brandProducts = products.filter((item) => item.brandSlug === pathname.slice('/brand/'.length));
    return { pathname, products: [...new Map(brandProducts.map((item) => [item.category, item])).values()].flatMap((first) => brandProducts.filter((item) => item.category === first.category).slice(0, 10)), brands, categories };
  }
  if (product) {
    const sameFamily = product.product_family ? products.filter((item) => item.id !== product.id && item.product_family === product.product_family) : [];
    const color = product.specs?.color;
    const moduleSize = product.specs?.module_size;
    const moduleVariants = color ? sameFamily.filter((item) => item.specs?.color === color && item.specs?.module_size && item.specs.module_size !== moduleSize) : [];
    const colorVariants = color ? sameFamily.filter((item) => item.specs?.color && item.specs.color !== color && item.specs?.module_size === moduleSize) : [];
    const variantProducts = Object.fromEntries(Object.keys(product.variant || {}).map((sku) => [sku, products.find((item) => item.sku === sku)]).filter(([, item]) => item));
    return { pathname, product, similarProducts: products.filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0, 4), moduleVariants, colorVariants, variantProducts };
  }
  return { pathname };
}

function prerender(pathname, product) {
  const initialData = initialDataFor(pathname, product);
  const { appHtml, metadata } = render(pathname, initialData);
  if (appHtml.includes('seo-static-shell')) throw new Error(`${pathname}: old static shell leaked into React output`);
  if (!metadata) throw new Error(`${pathname}: React route did not register SEO metadata.`);
  writeRoute(pathname, htmlForRoute(template, appHtml, metadata, initialData));
  payloadSizes[pathname] = Buffer.byteLength(safeJson(initialData));
}

for (const pathname of STATIC_PATHS) { prerender(pathname); routeSet.add(pathname); }
for (const pathname of NOINDEX_PATHS) prerender(pathname);
for (const categorySlug of ['switches-sockets', 'plates', 'circuit-protection', 'wires-cables', 'boxes', 'geysers']) { const pathname = `/category/${categorySlug}`; prerender(pathname); routeSet.add(pathname); }
for (const brand of brands) { const pathname = `/brand/${brand.slug}`; prerender(pathname); routeSet.add(pathname); }
for (const { hub } of activeHubs) { const pathname = `/brand/${hub.brandSlug}/${hub.slug}`; prerender(pathname); routeSet.add(pathname); }
for (const product of products) { prerender(product.urlPath, product); routeSet.add(product.urlPath); }
prerender('/404');
fs.copyFileSync(outputPathFor('/404'), path.join(DIST_DIR, '404.html'));

const sitemapUrls = [...routeSet].sort().map((routePath) => `  <url><loc>${escapeHtml(new URL(routePath, SITE_URL).toString())}</loc></url>`).join('\n');
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'seo-build-report.json'), `${JSON.stringify({ source: catalogue.source, apiUrl: catalogue.apiUrl, apiError: catalogue.apiError, fallback: catalogue.fallback, loadedProducts: catalogue.products.length, indexableProducts: products.length, excludedProducts: excludedProducts.length, categories: 6, brands: brands.length, commercialHubs: activeHubs.length, commercialHubPaths: activeHubs.map((entry) => `/brand/${entry.hub.brandSlug}/${entry.hub.slug}`), suppressedHubs: COMMERCIAL_HUBS.filter((hub) => !hubForPath.has(`/brand/${hub.brandSlug}/${hub.slug}`)).map((hub) => `/brand/${hub.brandSlug}/${hub.slug}`), indexableRoutes: routeSet.size, noindexRoutes: NOINDEX_PATHS.length, payloadSizes }, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'seo-excluded-products.json'), `${JSON.stringify(excludedProducts.map(({ product, reason }) => ({ id: product.id || null, sku: product.sku || null, name: product.name || null, brand: product.brand || null, urlPath: product.urlPath || null, reason })), null, 2)}\n`, 'utf8');
console.log(`React prerender complete: ${routeSet.size} indexable routes (${products.length} products, 6 categories, ${brands.length} brands, ${activeHubs.length} commercial hubs) from ${catalogue.source}.`);
