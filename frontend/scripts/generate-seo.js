import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, '..');
const REPO_DIR = path.resolve(FRONTEND_DIR, '..');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const FALLBACK_DATA_PATH = path.join(REPO_DIR, 'backend', 'app', 'parsing', 'output', 'all_products_full.json');
const SITE_URL = 'https://www.newdelhielectricals.com';
const DEFAULT_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

const CATEGORIES = [
  { slug: 'switches-sockets', name: 'Switches & Sockets', raw: ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'], description: 'Browse switches, sockets, fan controls, dimmers, data sockets and electrical accessories for Delhi NCR projects.' },
  { slug: 'plates', name: 'Plates', raw: ['Plates'], description: 'Browse modular switch plates and cover plates from authorised electrical brands in Delhi NCR.' },
  { slug: 'circuit-protection', name: 'Circuit Protection', raw: ['Circuit Protection'], description: 'Browse MCBs, RCCBs, RCBOs, isolators and circuit protection products for residential and commercial installations.' },
  { slug: 'boxes', name: 'Mounting Boxes', raw: ['Boxes'], description: 'Browse GI metal and plastic mounting boxes for flush and surface electrical installation.' },
  { slug: 'geysers', name: 'Geysers & Water Heaters', raw: ['geyser'], description: 'Browse instant and storage water heaters available for enquiry in Delhi NCR.' },
  { slug: 'wires-cables', name: 'Wires & Cables', raw: ['Wires & Cables'], description: 'Browse electrical wires and cables for residential and commercial projects in Delhi NCR.' },
];

const STATIC_PAGES = [
  { path: '/', title: 'Electrical Products & Authorised Brand Dealer in Delhi | New Delhi Electricals', description: 'Browse switches, sockets, plates, circuit protection, mounting boxes, geysers, wires and cables from authorised brands. Serving Delhi NCR.', h1: 'Electrical Products for Delhi NCR', text: 'New Delhi Electricals supplies genuine electrical products for homeowners, electricians, contractors, builders and designers across Delhi NCR.' },
  { path: '/about', title: 'About New Delhi Electricals | Electrical Dealer in Delhi', description: 'Learn about New Delhi Electricals, an electrical products dealer serving homeowners and trade customers across Delhi NCR.', h1: 'About New Delhi Electricals', text: 'We help customers select electrical products for homes, offices and commercial projects across Delhi NCR.' },
  { path: '/services', title: 'Electrical Product Supply & Quotations in Delhi | New Delhi Electricals', description: 'Request product selection help, bulk electrical supply and quotations for projects across Delhi NCR.', h1: 'Electrical Product Supply & Quotations', text: 'Browse the catalogue, select products and send your requirements for a quotation or WhatsApp enquiry.' },
  { path: '/contact', title: 'Contact New Delhi Electricals | Malviya Nagar, New Delhi', description: 'Contact New Delhi Electricals in Malviya Nagar for electrical product enquiries and quotations across Delhi NCR.', h1: 'Contact New Delhi Electricals', text: 'Visit or contact our Malviya Nagar store for electrical products, selection help and project quotations.' },
  { path: '/faq', title: 'Electrical Product Enquiry FAQ | New Delhi Electricals', description: 'Answers about electrical product enquiries, quotations, delivery and catalogue selection from New Delhi Electricals.', h1: 'Frequently Asked Questions', text: 'Find answers about browsing products, requesting a quotation and sending an enquiry.' },
  { path: '/categories', title: 'Electrical Product Categories in Delhi | New Delhi Electricals', description: 'Browse switches, sockets, plates, circuit protection, boxes, geysers, wires and cables available for enquiry in Delhi NCR.', h1: 'Electrical Product Categories', text: 'Choose a category to browse genuine electrical products for residential and commercial projects.' },
  { path: '/brands', title: 'Authorised Electrical Brands Dealer in Delhi | New Delhi Electricals', description: 'Browse genuine electrical products from Lauritz Knudsen, Havells, Anchor, Polycab and Finolex in Delhi NCR.', h1: 'Electrical Brands', text: 'Explore verified catalogue products by brand and send a WhatsApp enquiry for your requirements.' },
];

const NOINDEX_PAGES = [
  { path: '/search', title: 'Search Electrical Products | New Delhi Electricals', h1: 'Search Products' },
  { path: '/cart', title: 'Quotation Cart | New Delhi Electricals', h1: 'Quotation Cart' },
  { path: '/shortlist', title: 'Saved Products | New Delhi Electricals', h1: 'Saved Products' },
  { path: '/compare', title: 'Compare Products | New Delhi Electricals', h1: 'Compare Products' },
];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normaliseProduct(raw) {
  const brand = raw.brand || '';
  const slug = raw.slug || raw.catalog_source?.seo?.slug;
  const urlPath = raw.url_path || (brand && slug ? `/${slugify(brand)}/${slug}` : null);
  const images = raw.images || raw.media?.images?.map((image) => typeof image === 'string' ? image : image.url) || [];
  return {
    id: raw._id || raw.id || raw.sku,
    sku: raw.sku,
    name: raw.name,
    brand,
    category: raw.category,
    description: raw.description || raw.seo?.meta_description || '',
    images: images.filter(Boolean),
    listPrice: Number(raw.list_price || raw.pricing?.mrp || 0),
    currency: raw.currency || null,
    urlPath,
    active: raw.status?.is_active !== false,
  };
}

async function loadProducts() {
  const envFile = fs.readFileSync(path.join(FRONTEND_DIR, '.env.production'), 'utf8');
  const configuredApi = envFile.match(/^VITE_API_BASE_URL=(.+)$/m)?.[1]?.trim();
  if (configuredApi) {
    try {
      const response = await fetch(`${configuredApi.replace(/\/$/, '')}/api/products?pageSize=10000&is_active=true`, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error('API returned no products');
      return { products: payload.items.map(normaliseProduct), source: 'production API' };
    } catch (error) {
      console.warn(`SEO generation: production API unavailable (${error.message}); using repository export.`);
    }
  }
  const products = JSON.parse(fs.readFileSync(FALLBACK_DATA_PATH, 'utf8')).map(normaliseProduct);
  return { products, source: 'repository product export' };
}

function cleanTemplate(template) {
  return template
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+(?:name|property)="(?:description|keywords|author|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, '')
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/\s*<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
}

function pageHtml(template, { title, description, canonicalPath, h1, text, links = [], image, robots = 'index, follow', schema = [] }) {
  const canonical = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;
  const socialImage = image?.startsWith('http') ? image : DEFAULT_IMAGE;
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="${escapeHtml(robots)}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:site_name" content="New Delhi Electricals">`,
    `<meta property="og:image" content="${escapeHtml(socialImage)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(socialImage)}">`,
    ...schema.map((item) => `<script type="application/ld+json" data-seo-schema>${safeJson(item)}</script>`),
  ].join('\n    ');
  const navLinks = [
    ['/', 'Home'], ['/categories', 'Categories'], ['/brands', 'Brands'], ['/contact', 'Contact'],
  ];
  const shell = `<div class="seo-static-shell" style="font-family:system-ui,sans-serif;max-width:1120px;margin:auto;padding:24px;color:#111"><header><a href="/" style="font-weight:700">New Delhi Electricals</a><nav aria-label="Primary" style="display:flex;gap:16px;flex-wrap:wrap;margin:20px 0">${navLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav></header><main><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(text)}</p>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(h1)}" width="640" height="640" loading="eager" style="max-width:100%;height:auto;object-fit:contain">` : ''}${links.length ? `<nav aria-label="Related pages"><ul>${links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul></nav>` : ''}</main></div>`;
  return cleanTemplate(template)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
}

function outputPathFor(routePath) {
  if (routePath === '/') return TEMPLATE_PATH;
  return path.join(DIST_DIR, `${routePath.replace(/^\//, '')}.html`);
}

function writeRoute(routePath, html) {
  const outputPath = outputPathFor(routePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');
}

const { products: loadedProducts, source } = await loadProducts();
const products = loadedProducts.filter((product) => product.active && product.name && product.brand && product.urlPath);
const dedupedProducts = [...new Map(products.map((product) => [product.urlPath.toLowerCase(), product])).values()];
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const routeSet = new Set();

const organisation = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'New Delhi Electricals', url: `${SITE_URL}/`,
  telephone: '+91-9654102758',
  address: { '@type': 'PostalAddress', streetAddress: '30 A Corner Market, Malviya Nagar', addressLocality: 'New Delhi', postalCode: '110017', addressCountry: 'IN' },
  areaServed: 'Delhi NCR', openingHours: 'Mo-Su 10:00-19:30',
};

for (const page of STATIC_PAGES) {
  let links = [];
  if (page.path === '/' || page.path === '/categories') links = CATEGORIES.map((category) => ({ href: `/category/${category.slug}`, label: category.name }));
  if (page.path === '/brands') links = [...new Set(dedupedProducts.map((product) => product.brand))].sort().map((brand) => ({ href: `/brand/${slugify(brand)}`, label: brand }));
  writeRoute(page.path, pageHtml(template, { ...page, canonicalPath: page.path, links, schema: page.path === '/' ? [organisation] : [] }));
  routeSet.add(page.path);
}

for (const page of NOINDEX_PAGES) {
  writeRoute(page.path, pageHtml(template, { ...page, canonicalPath: page.path, description: `${page.h1} for New Delhi Electricals catalogue visitors.`, text: 'This utility page is not included in search indexes.', robots: 'noindex, follow' }));
}

for (const category of CATEGORIES) {
  const matches = dedupedProducts.filter((product) => category.raw.some((raw) => raw.toLowerCase() === String(product.category).toLowerCase()));
  const links = matches.slice(0, 24).map((product) => ({ href: product.urlPath, label: `${product.name} — ${product.brand}` }));
  const canonicalPath = `/category/${category.slug}`;
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
    { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}${canonicalPath}` },
  ] };
  writeRoute(canonicalPath, pageHtml(template, { title: `${category.name} in Delhi | New Delhi Electricals`, description: category.description, canonicalPath, h1: category.name, text: `${category.description} ${matches.length} catalogue products are available to browse.`, links, schema: [breadcrumb] }));
  routeSet.add(canonicalPath);
}

const brands = [...new Set(dedupedProducts.map((product) => product.brand))].sort();
for (const brand of brands) {
  const matches = dedupedProducts.filter((product) => product.brand === brand);
  const canonicalPath = `/brand/${slugify(brand)}`;
  const links = matches.slice(0, 24).map((product) => ({ href: product.urlPath, label: product.name }));
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Brands', item: `${SITE_URL}/brands` },
    { '@type': 'ListItem', position: 3, name: brand, item: `${SITE_URL}${canonicalPath}` },
  ] };
  writeRoute(canonicalPath, pageHtml(template, { title: `${brand} Electrical Products Dealer in Delhi | New Delhi Electricals`, description: `Browse ${matches.length} ${brand} electrical products and send an enquiry to New Delhi Electricals in Delhi NCR.`, canonicalPath, h1: `${brand} Electrical Products`, text: `Browse genuine ${brand} catalogue products available for enquiry from New Delhi Electricals.`, links, schema: [breadcrumb] }));
  routeSet.add(canonicalPath);
}

for (const product of dedupedProducts) {
  const category = CATEGORIES.find((item) => item.raw.some((raw) => raw.toLowerCase() === String(product.category).toLowerCase()));
  const categoryPath = category ? `/category/${category.slug}` : '/categories';
  const description = (product.description || `${product.name} by ${product.brand}. Send an enquiry to New Delhi Electricals for product details in Delhi NCR.`).slice(0, 160);
  const schema = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, description,
    ...(product.sku ? { sku: String(product.sku) } : {}),
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category,
    ...(product.images.length ? { image: product.images } : {}),
    url: `${SITE_URL}${product.urlPath}`,
    ...(product.listPrice > 0 && product.currency ? { offers: { '@type': 'Offer', price: product.listPrice, priceCurrency: product.currency, url: `${SITE_URL}${product.urlPath}` } } : {}),
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: category?.name || 'Categories', item: `${SITE_URL}${categoryPath}` },
    { '@type': 'ListItem', position: 3, name: product.brand, item: `${SITE_URL}/brand/${slugify(product.brand)}` },
    { '@type': 'ListItem', position: 4, name: product.name, item: `${SITE_URL}${product.urlPath}` },
  ] };
  const links = [
    { href: categoryPath, label: category?.name || 'All categories' },
    { href: `/brand/${slugify(product.brand)}`, label: `${product.brand} products` },
  ];
  const priceText = product.listPrice > 0 && product.currency === 'INR' ? ` Listed price: ₹${product.listPrice.toLocaleString('en-IN')}.` : '';
  writeRoute(product.urlPath, pageHtml(template, { title: `${product.name} | ${product.brand} Dealer in Delhi | New Delhi Electricals`, description, canonicalPath: product.urlPath, h1: product.name, text: `${product.brand} ${product.category} product.${priceText} Send a WhatsApp enquiry for selection and quotation support in Delhi NCR.`, links, image: product.images[0], schema: [schema, breadcrumb] }));
  routeSet.add(product.urlPath);
}

const sitemapUrls = [...routeSet].sort().map((routePath) => `  <url><loc>${escapeHtml(`${SITE_URL}${routePath === '/' ? '/' : routePath}`)}</loc></url>`).join('\n');
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');
fs.writeFileSync(path.join(DIST_DIR, '404.html'), pageHtml(template, { title: 'Page Not Found | New Delhi Electricals', description: 'The requested page could not be found.', canonicalPath: '/404', h1: 'Page Not Found', text: 'Return to the catalogue to continue browsing.', robots: 'noindex, nofollow' }), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'seo-build-report.json'), `${JSON.stringify({ source, loadedProducts: loadedProducts.length, indexableProducts: dedupedProducts.length, categories: CATEGORIES.length, brands: brands.length, indexableRoutes: routeSet.size, noindexRoutes: NOINDEX_PAGES.length }, null, 2)}\n`, 'utf8');

console.log(`SEO generation complete: ${routeSet.size} indexable routes (${dedupedProducts.length} products, ${CATEGORIES.length} categories, ${brands.length} brands) from ${source}.`);
