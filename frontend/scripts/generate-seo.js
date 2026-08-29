import crypto from 'node:crypto';
import fs from 'node:fs';
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
const FALLBACK_ENABLED = process.env.SEO_ALLOW_CATALOG_FALLBACK === 'true';

const CATEGORIES = [
  { slug: 'switches-sockets', name: 'Switches & Sockets', raw: ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'], description: 'Browse switches, sockets, fan controls, dimmers, data sockets and electrical accessories for Delhi NCR projects.' },
  { slug: 'plates', name: 'Plates', raw: ['Plates'], description: 'Browse modular switch plates and cover plates from authorised electrical brands in Delhi NCR.' },
  { slug: 'circuit-protection', name: 'Circuit Protection', raw: ['Circuit Protection'], description: 'Browse MCBs, RCCBs, RCBOs, isolators and circuit protection products for residential and commercial installations.' },
  { slug: 'boxes', name: 'Mounting Boxes', raw: ['Boxes'], description: 'Browse GI metal and plastic mounting boxes for flush and surface electrical installation.' },
  { slug: 'geysers', name: 'Geysers & Water Heaters', raw: ['geyser'], description: 'Browse instant and storage water heaters available for enquiry in Delhi NCR.' },
  { slug: 'wires-cables', name: 'Wires & Cables', raw: ['Wires & Cables'], description: 'Browse electrical wires and cables for residential and commercial projects in Delhi NCR.' },
];
const STATIC_PAGES = [
  ['/', 'Electrical Products & Authorised Brand Dealer in Delhi | New Delhi Electricals', 'Browse switches, sockets, plates, circuit protection, mounting boxes, geysers, wires and cables from authorised brands. Serving Delhi NCR.', 'Electrical Products for Delhi NCR', 'New Delhi Electricals supplies genuine electrical products for homeowners, electricians, contractors, builders and designers across Delhi NCR.'],
  ['/about', 'About New Delhi Electricals | Electrical Dealer in Delhi', 'Learn about New Delhi Electricals, an electrical products dealer serving homeowners and trade customers across Delhi NCR.', 'About New Delhi Electricals', 'We help customers select electrical products for homes, offices and commercial projects across Delhi NCR.'],
  ['/services', 'Electrical Product Supply & Quotations in Delhi | New Delhi Electricals', 'Request product selection help, bulk electrical supply and quotations for projects across Delhi NCR.', 'Electrical Product Supply & Quotations', 'Browse the catalogue, select products and send your requirements for a quotation or WhatsApp enquiry.'],
  ['/contact', 'Contact New Delhi Electricals | Malviya Nagar, New Delhi', 'Contact New Delhi Electricals in Malviya Nagar for electrical product enquiries and quotations across Delhi NCR.', 'Contact New Delhi Electricals', 'Visit or contact our Malviya Nagar store for electrical products, selection help and project quotations.'],
  ['/faq', 'Electrical Product Enquiry FAQ | New Delhi Electricals', 'Answers about electrical product enquiries, quotations, delivery and catalogue selection from New Delhi Electricals.', 'Frequently Asked Questions', 'Find answers about browsing products, requesting a quotation and sending an enquiry.'],
  ['/categories', 'Electrical Product Categories in Delhi | New Delhi Electricals', 'Browse switches, sockets, plates, circuit protection, boxes, geysers, wires and cables available for enquiry in Delhi NCR.', 'Electrical Product Categories', 'Choose a category to browse genuine electrical products for residential and commercial projects.'],
  ['/brands', 'Authorised Electrical Brands Dealer in Delhi | New Delhi Electricals', 'Browse genuine electrical products from Lauritz Knudsen, Havells, Anchor, Polycab and Finolex in Delhi NCR.', 'Electrical Brands', 'Explore verified catalogue products by brand and send a WhatsApp enquiry for your requirements.'],
];
const UTILITY_PAGES = [['/search', 'Search Electrical Products | New Delhi Electricals', 'Search Products'], ['/cart', 'Quotation Cart | New Delhi Electricals', 'Quotation Cart'], ['/shortlist', 'Saved Products | New Delhi Electricals', 'Saved Products'], ['/compare', 'Compare Products | New Delhi Electricals', 'Compare Products']];

function slugify(value = '') { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function escapeHtml(value = '') { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function safeJson(value) { return JSON.stringify(value).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
function normaliseProduct(raw) {
  const images = raw.images || raw.media?.images?.map(image => typeof image === 'string' ? image : image.url) || [];
  const brand = raw.brand || ''; const slug = raw.slug || raw.catalog_source?.seo?.slug || '';
  return { id: String(raw._id || raw.id || raw.sku || ''), sku: String(raw.sku || ''), name: raw.name || '', brand, brandSlug: raw.brand_slug || slugify(brand), category: raw.category || '', subcategory: raw.subcategory, series: raw.series || raw.product_family || '', product_family: raw.product_family || raw.series || '', listPrice: Number(raw.list_price || raw.pricing?.mrp || 0), discount: raw.catalog_source?.pricing?.discount || raw.pricing?.discount || null, currency: raw.currency || 'INR', images: images.filter(Boolean), specs: raw.specs || {}, description: raw.description || raw.seo?.meta_description || '', slug, urlPath: raw.url_path || (brand && slug ? `/${slugify(brand)}/${slug}` : undefined), comingSoon: raw.status?.coming_soon || false, isActive: raw.status?.is_active !== false, status: raw.status || {}, variant: raw.variant };
}
function apiUrl() { return fs.readFileSync(path.join(FRONTEND_DIR, '.env.production'), 'utf8').match(/^VITE_API_BASE_URL=(.+)$/m)?.[1]?.trim(); }
async function loadCatalogue() {
  const configuredApi = apiUrl(); const report = { apiUrl: configuredApi || null, apiFailure: null, fallbackUsed: false, fallback: null };
  try {
    if (!configuredApi) throw new Error('VITE_API_BASE_URL is not configured');
    const response = await fetch(`${configuredApi.replace(/\/$/, '')}/api/products?pageSize=10000&is_active=true`, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.items) || !payload.items.length) throw new Error('API returned no products');
    return { products: payload.items.map(normaliseProduct), source: 'production API', report };
  } catch (error) {
    report.apiFailure = error instanceof Error ? error.message : String(error);
    if (!FALLBACK_ENABLED) throw new Error(`Production catalogue API is required for SEO builds: ${report.apiFailure}. Set SEO_ALLOW_CATALOG_FALLBACK=true only for an explicitly labelled non-production fallback build.`);
    const stat = fs.statSync(FALLBACK_DATA_PATH); const body = fs.readFileSync(FALLBACK_DATA_PATH);
    report.fallbackUsed = true; report.fallback = { file: path.relative(REPO_DIR, FALLBACK_DATA_PATH), productCount: JSON.parse(body).length, modifiedAt: stat.mtime.toISOString(), sha256: crypto.createHash('sha256').update(body).digest('hex') };
    console.warn(`WARNING: SEO_ALLOW_CATALOG_FALLBACK=true; using stale repository catalogue after API failure: ${report.apiFailure}`);
    return { products: JSON.parse(body).map(normaliseProduct), source: 'repository fallback (explicit opt-in)', report };
  }
}
function cleanTemplate(template) { return template.replace(/\s*<title>[\s\S]*?<\/title>/i, '').replace(/\s*<meta\s+(?:name|property)="(?:description|robots|author|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, '').replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '').replace(/\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, ''); }
function documentFor(template, html, metadata, routeData) {
  const schema = metadata.schema.map(item => `<script type="application/ld+json" data-seo-schema>${safeJson(item)}</script>`).join('\n    ');
  const head = `<title>${escapeHtml(metadata.title)}</title>\n    <meta name="description" content="${escapeHtml(metadata.description)}">\n    <meta name="robots" content="${escapeHtml(metadata.robots)}">\n    <link rel="canonical" href="${escapeHtml(metadata.canonical)}">\n    <meta property="og:title" content="${escapeHtml(metadata.title)}">\n    <meta property="og:description" content="${escapeHtml(metadata.description)}">\n    <meta property="og:type" content="${metadata.type}">\n    <meta property="og:url" content="${escapeHtml(metadata.canonical)}">\n    <meta property="og:site_name" content="New Delhi Electricals">\n    <meta property="og:image" content="${escapeHtml(metadata.image)}">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${escapeHtml(metadata.title)}">\n    <meta name="twitter:description" content="${escapeHtml(metadata.description)}">\n    <meta name="twitter:image" content="${escapeHtml(metadata.image)}">${schema ? `\n    ${schema}` : ''}`;
  return cleanTemplate(template).replace('</head>', `    ${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${html}</div><script>window.__NDE_INITIAL_ROUTE_DATA__=${safeJson(routeData)};</script>`);
}
function outputPath(routePath) { return routePath === '/' ? TEMPLATE_PATH : path.join(DIST_DIR, `${routePath.replace(/^\//, '')}.html`); }
function writeRoute(routePath, content) { const target = outputPath(routePath); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content); }

const renderer = await import(`${pathToFileURL(SERVER_ENTRY).href}?v=${Date.now()}`);
const { products: rawProducts, source, report: sourceReport } = await loadCatalogue();
const eligible = rawProducts.filter(product => product.isActive && product.id && product.name && product.brand && product.urlPath);
const byPath = new Map(); const collisions = [];
for (const product of eligible) { const key = product.urlPath.toLowerCase(); const previous = byPath.get(key); if (previous) { collisions.push([product, previous]); byPath.delete(key); } else if (!collisions.some(([a, b]) => a.urlPath.toLowerCase() === key || b.urlPath.toLowerCase() === key)) byPath.set(key, product); }
const products = [...byPath.values()].sort((a, b) => a.name.localeCompare(b.name));
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8'); const routes = new Set();
function emit(data, indexable = true) { const result = renderer.render(data.path, data); writeRoute(data.path, documentFor(template, result.html, result.metadata, data)); if (indexable) routes.add(data.path); }

for (const [pathName, title, description, heading, text] of STATIC_PAGES) emit({ kind: pathName === '/' ? 'home' : 'static', path: pathName, title, description, heading, text, products: pathName === '/' ? products.slice(0, 12) : undefined });
for (const [pathName, title, heading] of UTILITY_PAGES) emit({ kind: 'utility', path: pathName, title, description: `${heading} for New Delhi Electricals catalogue visitors.`, heading, text: 'This utility page is not included in search indexes.', robots: 'noindex, follow' }, false);
for (const category of CATEGORIES) { const matches = products.filter(product => category.raw.some(raw => raw.toLowerCase() === product.category.toLowerCase())); emit({ kind: 'category', path: `/category/${category.slug}`, title: `${category.name} in Delhi | New Delhi Electricals`, description: category.description, heading: category.name, text: `${category.description} ${matches.length} catalogue products are available to browse.`, category, products: matches.slice(0, 24) }); }
const brands = [...new Set(products.map(product => product.brand))].sort();
for (const brandName of brands) { const matches = products.filter(product => product.brand === brandName); const brand = { slug: slugify(brandName), name: brandName }; emit({ kind: 'brand', path: `/brand/${brand.slug}`, title: `${brandName} Electrical Products Dealer in Delhi | New Delhi Electricals`, description: `Browse ${matches.length} ${brandName} electrical products and send an enquiry to New Delhi Electricals in Delhi NCR.`, heading: `${brandName} Electrical Products`, text: `Browse genuine ${brandName} catalogue products available for enquiry from New Delhi Electricals.`, brand, products: matches.slice(0, 24) }); }
for (const product of products) { const category = CATEGORIES.find(item => item.raw.some(raw => raw.toLowerCase() === product.category.toLowerCase())); const brand = { slug: slugify(product.brand), name: product.brand }; const variantOptions = Object.entries(product.variant || {}).map(([sku, color]) => { const match = products.find(candidate => candidate.sku === sku); return match?.urlPath ? { sku, color, name: match.name, urlPath: match.urlPath } : null; }).filter(Boolean); emit({ kind: 'product', path: product.urlPath, title: `${product.name} | ${product.brand} Dealer in Delhi | New Delhi Electricals`, description: (product.description || `${product.name} by ${product.brand}. Send an enquiry to New Delhi Electricals for product details in Delhi NCR.`).slice(0, 160), heading: product.name, product, brand, category, variantOptions }); }

const sitemap = [...routes].sort().map(route => `  <url><loc>${escapeHtml(`${SITE_URL}${route === '/' ? '/' : route}`)}</loc></url>`).join('\n');
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
emit({ kind: 'not-found', path: '/404', title: 'Page Not Found | New Delhi Electricals', description: 'The requested page could not be found.', heading: 'Page Not Found', text: 'Return to the catalogue to continue browsing.', robots: 'noindex, nofollow' }, false); fs.renameSync(outputPath('/404'), path.join(DIST_DIR, '404.html'));
const excluded = ['# Excluded duplicate canonical products', '', 'Products below are active API records sharing a canonical product path. They are excluded from the sitemap and generated output until catalogue data is corrected.', '', ...collisions.flatMap(([excludedProduct, retained]) => [`## ${excludedProduct.urlPath}`, `- Identifier: ${excludedProduct.id}`, `- Product name: ${excludedProduct.name}`, `- Brand: ${excludedProduct.brand}`, `- Canonical candidate: ${excludedProduct.urlPath}`, `- Conflicting record: ${retained.id} — ${retained.name}`, '- Reason excluded: duplicate canonical path would overwrite another product document.', '- Recommended data fix: assign a unique, stable product slug/url_path and rebuild from the production API.', ''])];
fs.mkdirSync(path.join(REPO_DIR, 'docs', 'seo'), { recursive: true }); fs.writeFileSync(path.join(REPO_DIR, 'docs', 'seo', 'excluded-products.md'), `${excluded.join('\n')}\n`);
const buildReport = { source, loadedProducts: rawProducts.length, indexableProducts: products.length, excludedDuplicateProducts: collisions.length, categories: CATEGORIES.length, brands: brands.length, indexableRoutes: routes.size, noindexRoutes: UTILITY_PAGES.length, catalogue: sourceReport };
fs.writeFileSync(path.join(DIST_DIR, 'seo-build-report.json'), `${JSON.stringify(buildReport, null, 2)}\n`);
console.log(`React SSR SEO generation complete: ${routes.size} indexable routes (${products.length} products) from ${source}.`);
