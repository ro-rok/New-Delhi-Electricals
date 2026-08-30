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
/** Products linked from each brand and category document. Hubs always link their full range. */
const GRID_SIZE = 60;

const CATEGORIES = [
  {
    slug: 'switches-sockets', name: 'Switches & Sockets', raw: ['Switches', 'Power Sockets', 'Fan Controls', 'Dimmers', 'Data Sockets', 'Accessories', 'Hospitality'],
    description: 'Modular switches, sockets, fan regulators, dimmers and data sockets from Lauritz Knudsen, Havells and Anchor. Compare ranges and request current pricing in Delhi NCR.',
    text: 'Modular switching is bought as a system: a function module for each point, then a plate wide enough to hold it. This page covers the switch, socket, fan control, dimmer, data socket and hospitality modules in our catalogue, across the Lauritz Knudsen, Havells and Anchor ranges. Pick a range below, then price the plates alongside it.',
  },
  {
    slug: 'plates', name: 'Plates', raw: ['Plates'],
    description: 'Modular switch plates and cover plates from Lauritz Knudsen, Havells and Anchor in 1M to 18M sizes. Match plates to your module schedule and request a quotation.',
    text: 'Cover plates finish a modular installation and have to match both the module count and the range they sit in. Our catalogue carries plates from 1M through 18M across the Lauritz Knudsen, Havells and Anchor ranges. Choose the plate range first, then confirm module widths per location.',
  },
  {
    slug: 'circuit-protection', name: 'Circuit Protection', raw: ['Circuit Protection'],
    description: 'MCBs, RCCBs, RCBOs, isolators and automatic changeovers from 6 A to 125 A. Compare ratings, poles and sensitivities, then request current pricing in Delhi NCR.',
    text: 'A distribution board is specified device by device: an incomer, earth-leakage protection, and a final-circuit breaker for each way. Our catalogue covers miniature circuit breakers in C curve, residual current circuit breakers at 30, 100 and 300 mA sensitivity, combined RCBOs, isolators and automatic changeovers, in single, double, triple and four-pole formats from 6 A to 125 A. Send your DB schedule and we will price it as one list.',
  },
  {
    slug: 'boxes', name: 'Mounting Boxes', raw: ['Boxes'],
    description: 'GI metal and plastic mounting boxes for flush and surface electrical installation, sized to modular plate schedules. Request current pricing in Delhi NCR.',
    text: 'Mounting boxes are ordered against the same schedule as the plates that cover them, so the box size follows the module count at each location. This page lists the flush and surface boxes in our catalogue.',
  },
  {
    slug: 'geysers', name: 'Geysers & Water Heaters', raw: ['geyser'],
    description: 'Water heaters available to enquire from New Delhi Electricals in Delhi NCR. Tell us the capacity and mounting you need and we will confirm what can be supplied.',
    text: 'Our online catalogue currently lists a small water-heater selection. If you need a particular capacity, type or brand, send the requirement and we will confirm what can be supplied rather than have you choose from an incomplete list.',
  },
  {
    slug: 'wires-cables', name: 'Wires & Cables', raw: ['Wires & Cables'],
    description: 'Polycab and Finolex single-core copper house wire from 0.75 to 35 sq mm, in FR, FRLS and FR-LSH grades, with current catalogue prices and per-coil quantities.',
    text: 'House wire is chosen by conductor size, flame-retardant grade and coil length. Our catalogue carries Polycab FR-LSH and Finolex FR and FRLS single-core copper wire from 0.75 sq mm up to 35 sq mm, in coils from 90 m to 300 m, with current catalogue list prices against every record. Sizing follows the circuit design your electrician or consultant has prepared; send that schedule and we will price the quantities against it.',
  },
];

/** Per-brand landing copy. Anything not listed here falls back to a factual generic profile. */
const BRAND_PROFILES = {
  Finolex: {
    title: 'Finolex Wires & Cables Dealer in Delhi | New Delhi Electricals',
    description: 'Authorised Finolex dealer in Delhi NCR. Browse the Finolex FR and FRLS house wire range with current catalogue prices and request a quotation on WhatsApp.',
    heading: 'Finolex Dealer in Delhi NCR',
    text: 'New Delhi Electricals is an authorised dealer for Finolex, supplying customers across Delhi NCR from our counter at 30 A Corner Market, Malviya Nagar. The Finolex products in our catalogue are single-core copper house wire in two flame-retardant grades, FR and FRLS, covering 0.75 sq mm through 35 sq mm in 90 m, 100 m, 200 m and 300 m coils. Every record carries a current catalogue list price, and quantities are quoted on request.',
    propositions: [
      'Authorised Finolex dealer serving homeowners, electricians, contractors, builders and designers across Delhi NCR.',
      'Full FR and FRLS house wire range with conductor size, coil length and current catalogue list price on every record.',
      'Send a bill of quantities or a circuit schedule on WhatsApp and we will price the whole requirement together.',
    ],
  },
  Polycab: {
    title: 'Polycab Wires & Cables Dealer in Delhi | New Delhi Electricals',
    description: 'Authorised Polycab dealer in Delhi NCR. Browse the Polycab FR-LSH house wire range with current catalogue prices and request a quotation on WhatsApp.',
    heading: 'Polycab Dealer in Delhi NCR',
    text: 'New Delhi Electricals is an authorised dealer for Polycab, serving Delhi NCR from Malviya Nagar. The Polycab products in our catalogue are FR-LSH single-core copper house wire from 0.75 sq mm to 16 sq mm, supplied in 200 m and 300 m coils, each with a current catalogue list price.',
    propositions: [
      'Authorised Polycab dealer supplying homeowners, electricians, contractors and project buyers across Delhi NCR.',
      'FR-LSH house wire listed by conductor size and coil length, with a per-metre comparison on the wires page.',
      'Bulk and project quantities are quoted on request against your bill of quantities.',
    ],
  },
  Havells: {
    title: 'Havells Dealer in Delhi | Switches, Sockets & Plates | New Delhi Electricals',
    description: 'Authorised Havells dealer in Delhi NCR. Browse Signia and Fabio modular switches, sockets, plates and accessories with current catalogue prices and request a quote.',
    heading: 'Havells Dealer in Delhi NCR',
    text: 'New Delhi Electricals is an authorised dealer for Havells, serving Delhi NCR from Malviya Nagar. Our Havells catalogue is built around the Signia and Fabio modular ranges — switches, shuttered sockets, USB charging modules, fan regulators, data sockets, relay and scene controllers — together with the matching cover plates and accessories.',
    propositions: [
      'Authorised Havells dealer serving homeowners, electricians, contractors, builders, architects and interior designers across Delhi NCR.',
      'Signia and Fabio modular ranges listed with module width, current rating and finish on every record.',
      'Modules, plates and accessories quoted together against a room or floor schedule.',
    ],
  },
  Anchor: {
    title: 'Anchor Dealer in Delhi | Penta Switches, Sockets & Plates | New Delhi Electricals',
    description: 'Authorised Anchor dealer in Delhi NCR. Browse the Anchor Penta modular range and matching plates with current catalogue prices and request a quotation.',
    heading: 'Anchor Dealer in Delhi NCR',
    text: 'New Delhi Electricals is an authorised dealer for Anchor, serving Delhi NCR from Malviya Nagar. Our Anchor catalogue is centred on the Penta modular range — switches, sockets, fan regulators, dimmers, data sockets and hospitality modules in 1M to 4M widths — plus the matching Penta cover plates.',
    propositions: [
      'Authorised Anchor dealer supplying homes, rental and builder-floor projects and hospitality sites across Delhi NCR.',
      'Penta modules listed by module width, current rating and finish, with matching plates in the same range.',
      'Repeat point schedules across several units are quoted as one bulk requirement.',
    ],
  },
  'Lauritz Knudsen': {
    title: 'Lauritz Knudsen Dealer in Delhi | Switches & Circuit Protection | New Delhi Electricals',
    description: 'Authorised Lauritz Knudsen dealer in Delhi NCR. Browse modular switches, plates and the Tripper circuit protection range with current catalogue prices.',
    heading: 'Lauritz Knudsen Dealer in Delhi NCR',
    text: 'New Delhi Electricals is an authorised dealer for Lauritz Knudsen, serving Delhi NCR from Malviya Nagar. It is our deepest catalogue: the Englaze, Entice, Encurve, Engem and Enconnect modular ranges with their cover plates, and the Tripper circuit protection range covering MCBs, RCCBs, RCBOs, isolators and automatic changeovers from 6 A to 125 A.',
    propositions: [
      'Authorised Lauritz Knudsen dealer serving homeowners, electricians, contractors, builders and designers across Delhi NCR.',
      'Five modular ranges plus the Tripper circuit protection range, listed with ratings, poles and module widths.',
      'Distribution board schedules and room-by-room point schedules are quoted as a single list.',
    ],
  },
};

const HOME = {
  title: 'Electrical Shop in Delhi NCR — Switches, Wires & MCBs | New Delhi Electricals',
  description: 'Authorised dealer for Lauritz Knudsen, Havells, Anchor, Polycab and Finolex. Browse the catalogue, compare ranges and get a quotation on WhatsApp across Delhi NCR.',
  heading: 'Electrical Shop in Delhi NCR for Homes, Trade and Projects',
  text: 'New Delhi Electricals is an authorised dealer for Lauritz Knudsen, Havells, Anchor, Polycab and Finolex, working from 30 A Corner Market, Malviya Nagar and serving Delhi NCR. Browse modular switches and sockets, cover plates, circuit protection, mounting boxes, house wire and water heaters, then send your requirement for a quotation on WhatsApp.',
  propositions: [
    'Authorised dealer for Lauritz Knudsen, Havells, Anchor, Polycab and Finolex. Every catalogue record is a genuine branded product.',
    'We supply homeowners, electricians, electrical contractors, builders and developers, and architects and interior designers.',
    'Browse the catalogue and send a list, a point schedule or a bill of quantities. We reply with current pricing on WhatsApp.',
  ],
};

const STATIC_PAGES = [
  ['/', HOME.title, HOME.description, HOME.heading, HOME.text, HOME.propositions],
  ['/about', 'About New Delhi Electricals | Our Malviya Nagar Store', 'How New Delhi Electricals works: our Malviya Nagar counter, the brands we are authorised for, and how enquiries and quotations are handled.', 'About New Delhi Electricals', 'We are a family-run electrical retailer at 30 A Corner Market, Malviya Nagar, New Delhi. We hold authorised dealerships with Lauritz Knudsen, Havells, Anchor, Polycab and Finolex, and we help customers select the right product for the job rather than simply listing stock.'],
  ['/services', 'Electrical Product Supply & Quotations in Delhi | New Delhi Electricals', 'Product selection help, bulk supply and written quotations for residential and commercial projects across Delhi NCR.', 'Electrical Product Supply & Quotations', 'Send a product list, a room-by-room point schedule or a bill of quantities and we will return current pricing. We help match modules to plates, size circuit protection against a DB schedule and select house wire against a circuit design.'],
  ['/contact', 'Contact New Delhi Electricals | Malviya Nagar, New Delhi', 'Contact New Delhi Electricals in Malviya Nagar for electrical product enquiries and quotations across Delhi NCR.', 'Contact New Delhi Electricals', 'Visit the counter at 30 A Corner Market, Malviya Nagar, New Delhi 110017, open Monday to Sunday, 10:00 to 19:30. Call 9654102758 or send your requirement on WhatsApp for a quotation.'],
  ['/faq', 'Electrical Product Enquiry FAQ | New Delhi Electricals', 'Answers about browsing the catalogue, requesting a quotation, pricing and delivery from New Delhi Electricals.', 'Frequently Asked Questions', 'How to browse the catalogue, build a quotation list, send a requirement on WhatsApp and what information helps us price a project accurately.'],
  ['/categories', 'Electrical Product Categories in Delhi | New Delhi Electricals', 'Browse switches and sockets, plates, circuit protection, mounting boxes, house wire and water heaters available for enquiry in Delhi NCR.', 'Electrical Product Categories', 'Each category groups the catalogue the way an installation is actually specified, so you can work from modules to plates, or from a DB schedule to individual devices.'],
  ['/brands', 'Electrical Brands We Carry | New Delhi Electricals', 'The electrical brands New Delhi Electricals is an authorised dealer for: Lauritz Knudsen, Havells, Anchor, Polycab and Finolex.', 'Brands in Our Catalogue', 'We are an authorised dealer for each brand below. Choose a brand to see the ranges we carry, or go straight to one of the range pages for sizes, ratings and current catalogue prices.'],
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
    const response = await fetch(`${configuredApi.replace(/\/$/, '')}/api/products?pageSize=10000&is_active=true`, { signal: AbortSignal.timeout(120000) });
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
const { COMMERCIAL_HUBS, hubPath, hubsForBrand, hubsForCategoryPath, selectHubProducts } = renderer;
const { products: rawProducts, source, report: sourceReport } = await loadCatalogue();
const eligible = rawProducts.filter(product => product.isActive && product.id && product.name && product.brand && product.urlPath);
const byPath = new Map(); const collisions = [];
for (const product of eligible) { const key = product.urlPath.toLowerCase(); const previous = byPath.get(key); if (previous) { collisions.push([product, previous]); byPath.delete(key); } else if (!collisions.some(([a, b]) => a.urlPath.toLowerCase() === key || b.urlPath.toLowerCase() === key)) byPath.set(key, product); }
const products = [...byPath.values()].sort((a, b) => a.name.localeCompare(b.name));
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8'); const routes = new Set();
/** Every product path linked from a non-product document, used for the orphan report. */
const linkedProducts = new Set();

function emit(data, indexable = true) {
  for (const product of data.products || []) if (data.kind !== 'product' && product.urlPath) linkedProducts.add(product.urlPath);
  for (const group of data.catalogIndex?.groups || []) for (const item of group.items) linkedProducts.add(item.path);
  const result = renderer.render(data.path, data);
  writeRoute(data.path, documentFor(template, result.html, result.metadata, data));
  if (indexable) routes.add(data.path);
}

const categoryOf = product => CATEGORIES.find(item => item.raw.some(raw => raw.toLowerCase() === product.category.toLowerCase()));
const categoryProducts = category => products.filter(product => category.raw.some(raw => raw.toLowerCase() === product.category.toLowerCase()));
const brandNames = [...new Set(products.map(product => product.brand))].sort();
const approvedHubs = COMMERCIAL_HUBS
  .map(hub => ({ hub, items: selectHubProducts(hub, products) }))
  .filter(entry => entry.items.length > 0);
const hubLink = hub => ({ label: hub.heading, path: hubPath(hub) });
/** Grid payloads only need what a product card renders; dropping copy and media keeps documents small. */
const listProduct = product => ({ id: product.id, sku: product.sku, name: product.name, brand: product.brand, brandSlug: product.brandSlug, category: product.category, slug: product.slug, urlPath: product.urlPath, listPrice: product.listPrice, specs: product.specs });

/** A brand-balanced slice, so a large brand cannot crowd every other brand out of a category grid. */
function balancedByBrand(items, limit) {
  const buckets = new Map();
  for (const item of items) { if (!buckets.has(item.brand)) buckets.set(item.brand, []); buckets.get(item.brand).push(item); }
  const queues = [...buckets.values()]; const picked = [];
  for (let index = 0; picked.length < limit && queues.some(queue => queue.length > index); index += 1) {
    for (const queue of queues) { if (picked.length >= limit) break; if (queue[index]) picked.push(queue[index]); }
  }
  return picked;
}

const categoryLinks = () => CATEGORIES.map(category => ({ label: `${category.name} (${categoryProducts(category).length})`, path: `/category/${category.slug}` }));
const brandLinks = () => brandNames.map(name => ({ label: `${name} products`, path: `/brand/${slugify(name)}` }));

// ---------------------------------------------------------------- static pages
for (const [pathName, title, description, heading, text, propositions] of STATIC_PAGES) {
  const isHome = pathName === '/';
  const links = isHome ? [
    { heading: 'Shop by category', items: categoryLinks() },
    { heading: 'Authorised brands', items: brandLinks() },
    { heading: 'Popular ranges in Delhi NCR', items: approvedHubs.map(entry => hubLink(entry.hub)) },
  ] : pathName === '/categories' ? [{ heading: 'All categories', items: categoryLinks() }, { heading: 'Brand ranges', items: approvedHubs.map(entry => hubLink(entry.hub)) }]
    : pathName === '/brands' ? [{ heading: 'All brands', items: brandLinks() }, { heading: 'Brand ranges', items: approvedHubs.map(entry => hubLink(entry.hub)) }]
    : [{ heading: 'Browse the catalogue', items: [...categoryLinks(), ...brandLinks().slice(0, 5)] }];
  emit({
    kind: isHome ? 'home' : 'static', path: pathName, title, description, heading, text, propositions, links,
    products: isHome ? balancedByBrand(products, 12).map(listProduct) : undefined,
  });
}

for (const [pathName, title, heading] of UTILITY_PAGES) emit({ kind: 'utility', path: pathName, title, description: `${heading} for New Delhi Electricals catalogue visitors.`, heading, text: 'This utility page is not included in search indexes.', robots: 'noindex, follow' }, false);

// ---------------------------------------------------------------- categories
for (const category of CATEGORIES) {
  const matches = categoryProducts(category);
  const hubs = hubsForCategoryPath(`/category/${category.slug}`).filter(hub => approvedHubs.some(entry => entry.hub === hub));
  const brandsHere = [...new Set(matches.map(product => product.brand))].sort();
  emit({
    kind: 'category', path: `/category/${category.slug}`,
    title: `${category.name} in Delhi NCR | Prices & Quote | New Delhi Electricals`,
    description: category.description, heading: `${category.name} in Delhi NCR`,
    text: `${category.text} ${matches.length} catalogue ${matches.length === 1 ? 'product is' : 'products are'} listed in this category.`,
    category: { slug: category.slug, name: category.name, description: category.description },
    products: balancedByBrand(matches, GRID_SIZE).map(listProduct),
    catalogIndex: {
      heading: `Complete ${category.name.toLowerCase()} catalogue`,
      groups: brandsHere.map(name => ({
        heading: `${name} (${matches.filter(product => product.brand === name).length})`,
        items: matches.filter(product => product.brand === name).map(product => ({ label: product.name, path: product.urlPath })),
      })),
    },
    links: [
      ...(hubs.length ? [{ heading: 'Brand ranges in this category', items: hubs.map(hubLink) }] : []),
      { heading: 'Brands in this category', items: brandsHere.map(name => ({ label: `${name} ${category.name.toLowerCase()}`, path: `/brand/${slugify(name)}` })) },
      { heading: 'Other categories', items: categoryLinks().filter(link => link.path !== `/category/${category.slug}`) },
    ],
  });
}

// ---------------------------------------------------------------- brands
for (const brandName of brandNames) {
  const matches = products.filter(product => product.brand === brandName);
  const brand = { slug: slugify(brandName), name: brandName };
  const profile = BRAND_PROFILES[brandName];
  const hubs = hubsForBrand(brandName).filter(hub => approvedHubs.some(entry => entry.hub === hub));
  const categoriesHere = [...new Set(matches.map(product => categoryOf(product)).filter(Boolean))];
  emit({
    kind: 'brand', path: `/brand/${brand.slug}`,
    title: profile?.title || `${brandName} Electrical Products Dealer in Delhi | New Delhi Electricals`,
    description: profile?.description || `Browse ${matches.length} ${brandName} electrical products from an authorised dealer and send an enquiry to New Delhi Electricals in Delhi NCR.`,
    heading: profile?.heading || `${brandName} Electrical Products`,
    text: `${profile?.text || `New Delhi Electricals is an authorised dealer for ${brandName}, serving Delhi NCR from Malviya Nagar.`} ${matches.length} ${brandName} catalogue ${matches.length === 1 ? 'product is' : 'products are'} available to browse.`,
    propositions: profile?.propositions,
    brand, products: matches.slice(0, GRID_SIZE).map(listProduct),
    links: [
      ...(hubs.length ? [{ heading: `${brandName} ranges in Delhi NCR`, items: hubs.map(hubLink) }] : []),
      { heading: `${brandName} categories we carry`, items: categoriesHere.map(category => ({ label: `${brandName} ${category.name.toLowerCase()}`, path: `/category/${category.slug}` })) },
      { heading: 'Other brands', items: brandLinks().filter(link => link.path !== `/brand/${brand.slug}`) },
    ],
  });
}

// ---------------------------------------------------------------- commercial hubs
for (const { hub, items } of approvedHubs) {
  emit({
    kind: 'hub', path: hubPath(hub), title: hub.title, description: hub.description, heading: hub.heading,
    hub: { brandSlug: hub.brandSlug, slug: hub.slug }, products: items.map(listProduct),
  });
}

// ---------------------------------------------------------------- products
// Several catalogue records share a product name with a sibling (colour or range variants that
// were never renamed at source). Titles and descriptions are disambiguated with the record's own
// series, finish or SKU so no two documents compete on identical metadata.
const sameName = new Map();
for (const product of products) {
  const key = `${product.brand}|${product.name}`;
  if (!sameName.has(key)) sameName.set(key, []);
  sameName.get(key).push(product);
}
function qualifierFor(product) {
  const siblings = sameName.get(`${product.brand}|${product.name}`) || [];
  if (siblings.length < 2) return null;
  const distinct = (accessor) => new Set(siblings.map(accessor).filter(Boolean)).size === siblings.length;
  if (product.series && distinct(item => item.series)) return { text: `from the ${product.series} range`, suffix: product.series };
  if (product.specs?.color && distinct(item => item.specs?.color)) return { text: `in ${product.specs.color}`, suffix: String(product.specs.color) };
  return { text: `SKU ${product.sku}`, suffix: product.sku };
}
for (const product of products) {
  const category = categoryOf(product);
  const brand = { slug: slugify(product.brand), name: product.brand };
  const variantOptions = Object.entries(product.variant || {}).map(([sku, color]) => { const match = products.find(candidate => candidate.sku === sku); return match?.urlPath ? { sku, color, name: match.name, urlPath: match.urlPath } : null; }).filter(Boolean);
  const qualifier = qualifierFor(product);
  const base = product.description || `${product.name} by ${product.brand}. Send an enquiry to New Delhi Electricals for product details in Delhi NCR.`;
  emit({
    kind: 'product', path: product.urlPath,
    title: `${product.name}${qualifier ? ` — ${qualifier.suffix}` : ''} | ${product.brand} Dealer in Delhi | New Delhi Electricals`,
    description: (qualifier ? `${product.brand} ${product.name} ${qualifier.text}. ${base}` : base).slice(0, 160),
    heading: product.name, product, brand, category, variantOptions,
  });
}

const sitemap = [...routes].sort().map(route => `  <url><loc>${escapeHtml(`${SITE_URL}${route === '/' ? '/' : route}`)}</loc></url>`).join('\n');
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
emit({ kind: 'not-found', path: '/404', title: 'Page Not Found | New Delhi Electricals', description: 'The requested page could not be found.', heading: 'Page Not Found', text: 'Return to the catalogue to continue browsing.', robots: 'noindex, nofollow' }, false); fs.renameSync(outputPath('/404'), path.join(DIST_DIR, '404.html'));
const excluded = ['# Excluded duplicate canonical products', '', 'Products below are active API records sharing a canonical product path. They are excluded from the sitemap and generated output until catalogue data is corrected.', '', ...collisions.flatMap(([excludedProduct, retained]) => [`## ${excludedProduct.urlPath}`, `- Identifier: ${excludedProduct.id}`, `- Product name: ${excludedProduct.name}`, `- Brand: ${excludedProduct.brand}`, `- Canonical candidate: ${excludedProduct.urlPath}`, `- Conflicting record: ${retained.id} — ${retained.name}`, '- Reason excluded: duplicate canonical path would overwrite another product document.', '- Recommended data fix: assign a unique, stable product slug/url_path and rebuild from the production API.', ''])];
fs.mkdirSync(path.join(REPO_DIR, 'docs', 'seo'), { recursive: true }); fs.writeFileSync(path.join(REPO_DIR, 'docs', 'seo', 'excluded-products.md'), `${excluded.join('\n')}\n`);
const buildReport = {
  source, loadedProducts: rawProducts.length, indexableProducts: products.length, excludedDuplicateProducts: collisions.length,
  categories: CATEGORIES.length, brands: brandNames.length,
  commercialHubs: approvedHubs.map(entry => ({ path: hubPath(entry.hub), brand: entry.hub.brandName, category: entry.hub.categoryName, products: entry.items.length })),
  suppressedHubs: COMMERCIAL_HUBS.filter(hub => !approvedHubs.some(entry => entry.hub === hub)).map(hub => hubPath(hub)),
  indexableRoutes: routes.size, noindexRoutes: UTILITY_PAGES.length,
  internalLinks: { productsLinkedFromNonProductPages: linkedProducts.size, productsWithoutInternalLinks: products.length - linkedProducts.size },
  catalogue: sourceReport,
};
fs.writeFileSync(path.join(DIST_DIR, 'seo-build-report.json'), `${JSON.stringify(buildReport, null, 2)}\n`);
console.log(`React SSR SEO generation complete: ${routes.size} indexable routes (${products.length} products, ${approvedHubs.length} commercial hubs) from ${source}.`);
