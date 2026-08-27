import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const report = JSON.parse(fs.readFileSync(path.join(dist, 'seo-build-report.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  const value = fs.readFileSync(path.join(dist, relativePath), 'utf8');
  assert(/<title>[^<]+<\/title>/.test(value), `${relativePath}: missing title`);
  assert(/<meta name="description" content="[^"]+">/.test(value), `${relativePath}: missing description`);
  assert(/<link rel="canonical" href="https:\/\/www\.newdelhielectricals\.com\/[^"]*">/.test(value), `${relativePath}: missing absolute canonical`);
  assert(/<h1>[^<]+<\/h1>/.test(value), `${relativePath}: missing H1`);
  assert(/<a href="\/[^"]*">/.test(value), `${relativePath}: missing crawlable links`);
  return value;
}

assert(report.indexableRoutes > 1000, 'Expected more than 1,000 indexable catalogue routes');
assert(report.categories === 6, 'Expected six commercial category routes');
assert(report.brands >= 3, 'Expected at least three brands with inventory');

const home = read('index.html');
const category = read(path.join('category', 'switches-sockets.html'));
const brand = read(path.join('brand', 'havells.html'));
const productFiles = fs.readdirSync(path.join(dist, 'havells')).filter((file) => file.endsWith('.html'));
assert(productFiles.length > 0, 'Expected at least one Havells product page');
const product = read(path.join('havells', productFiles[0]));
assert(home.includes('LocalBusiness'), 'Homepage missing LocalBusiness schema');
assert(category.includes('BreadcrumbList'), 'Category missing BreadcrumbList schema');
assert(brand.includes('BreadcrumbList'), 'Brand missing BreadcrumbList schema');
assert(product.includes('"@type":"Product"'), 'Product missing Product schema');
assert(product.includes('"@type":"Offer"'), 'Product with verified price missing Offer schema');

const search = read('search.html');
assert(search.includes('noindex, follow'), 'Search route must be noindex');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
assert(!sitemap.includes('/search'), 'Sitemap must exclude search');
assert(!sitemap.includes('/admin'), 'Sitemap must exclude admin');
assert(!sitemap.includes('/cart'), 'Sitemap must exclude cart');
assert(!fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8').includes('Disallow: /assets'), 'robots.txt must not block render assets');
assert(![home, category, brand, product].some((html) => /InStock|aggregateRating|reviewCount/.test(html)), 'Generated schema contains unverified inventory or review data');

console.log(`SEO output verified: ${report.indexableRoutes} indexable routes and ${report.noindexRoutes} noindex utility routes.`);
