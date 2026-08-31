import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const dist = path.join(root, 'dist');
const siteUrl = 'https://www.newdelhielectricals.com';
const report = JSON.parse(fs.readFileSync(path.join(dist, 'seo-build-report.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const failures = [];
const warnings = [];

function fail(url, message) { failures.push({ url, message }); }
function routeFile(url) {
  const pathname = new URL(url).pathname;
  return pathname === '/' ? path.join(dist, 'index.html') : path.join(dist, `${pathname.slice(1)}.html`);
}
function count(html, regex) { return [...html.matchAll(regex)].length; }
function containsNullish(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.some(containsNullish);
  return typeof value === 'object' && Object.values(value).some(containsNullish);
}
function validateSchema(url, html) {
  const scripts = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const schema = JSON.parse(match[1]);
      if (containsNullish(schema)) fail(url, 'JSON-LD contains null/undefined data');
      const serialized = JSON.stringify(schema);
      if (/InStock|aggregateRating|reviewCount|"review"|priceValidUntil|gtin|mpn/i.test(serialized)) fail(url, 'JSON-LD contains unverified availability, review, or product-identifier claims');
      if (schema['@type'] === 'Product' && schema.offers) fail(url, 'Product schema must omit Offer for enquiry-only pricing');
    } catch (error) { fail(url, `invalid JSON-LD: ${error.message}`); }
  }
  if (scripts.some((script) => /<\/script/i.test(script[1]))) fail(url, 'JSON-LD can terminate its script element');
}

if (!/^<\?xml\b/.test(sitemap) || !/<urlset\b/.test(sitemap)) fail('/sitemap.xml', 'invalid sitemap XML envelope');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const urlSet = new Set(urls);
if (urls.length !== urlSet.size) fail('/sitemap.xml', 'duplicate URLs');
for (const url of urls) {
  let parsed;
  try { parsed = new URL(url); } catch { fail(url, 'malformed sitemap URL'); continue; }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.newdelhielectricals.com') fail(url, 'URL is not preferred HTTPS www');
  if (parsed.search || parsed.hash || /%(?![0-9A-F]{2})/i.test(url)) fail(url, 'URL has query/hash or malformed encoding');
  if (/\/(admin|search|cart|shortlist|compare)(\/|$)/.test(parsed.pathname)) fail(url, 'utility URL is in sitemap');
  if (!fs.existsSync(routeFile(url))) fail(url, 'sitemap URL has no generated route file');
}
for (const url of urls) {
  const filename = routeFile(url);
  if (!fs.existsSync(filename)) continue;
  const html = fs.readFileSync(filename, 'utf8');
  if (!/<html\b/i.test(html) || !/<body\b/i.test(html) || !html.includes('<div id="root">')) fail(url, 'HTML does not contain a parseable document/root');
  if (count(html, /<title(?:\s[^>]*)?>/gi) !== 1) fail(url, 'expected exactly one title');
  if (count(html, /<meta\s+name="description"/gi) !== 1) fail(url, 'expected exactly one meta description');
  if (count(html, /<link\s+rel="canonical"/gi) !== 1) fail(url, 'expected exactly one canonical');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (canonical !== url || !canonical?.startsWith(siteUrl)) fail(url, `canonical does not match route (${canonical || 'missing'})`);
  if (count(html, /<h1(?:\s[^>]*)?>/gi) !== 1) fail(url, 'expected exactly one H1');
  if (!/<div id="root">[\s\S]{500,}<\/div>\s*<script>window\.__NDE_INITIAL_ROUTE_DATA__/i.test(html)) fail(url, 'React root content is empty');
  if (html.includes('seo-static-shell')) fail(url, 'legacy handcrafted SEO shell is present');
  if (!html.includes('window.__NDE_INITIAL_ROUTE_DATA__')) fail(url, 'missing serialized React initial route data');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) fail(url, 'indexable route is noindex');
  validateSchema(url, html);
}
if (urls.length !== report.indexableRoutes) fail('/sitemap.xml', `sitemap URL count ${urls.length} does not match generated indexable routes ${report.indexableRoutes}`);
if (report.source !== 'production API') warnings.push(`Catalogue source: ${report.source}`);

const excluded = JSON.parse(fs.readFileSync(path.join(dist, 'seo-excluded-products.json'), 'utf8'));
const escape = (value) => String(value || '—').replaceAll('|', '\\|');
const excludedLines = [
  '# Excluded Active Products', '', `Generated from the SEO build report. Catalogue source: ${report.source}.`, '',
  '| Identifier | Product name | Brand | Existing slug/path | Reason excluded | Recommended fix |',
  '| --- | --- | --- | --- | --- | --- |',
  ...excluded.map((item) => `| ${escape(item.sku || item.id)} | ${escape(item.name)} | ${escape(item.brand)} | ${escape(item.urlPath)} | ${escape(item.reason)} | ${item.reason === 'duplicate canonical' ? 'Resolve the duplicate route/slug in the catalogue, then rebuild.' : 'Correct the source record and rebuild; do not fabricate a URL.'} |`), '',
];
fs.writeFileSync(path.join(repo, 'docs', 'seo', 'excluded-products.md'), excludedLines.join('\n'), 'utf8');

const summary = {
  routesChecked: urls.length,
  passed: urls.length - new Set(failures.map((failure) => failure.url)).size,
  failed: failures.length,
  warnings: warnings.length,
  duplicateCanonicals: failures.filter((failure) => failure.message.includes('canonical')).length,
  duplicateSlugs: excluded.filter((item) => item.reason === 'duplicate slug' || item.reason === 'duplicate canonical').length,
  schemaErrors: failures.filter((failure) => failure.message.includes('JSON-LD') || failure.message.includes('schema')).length,
  missingH1: failures.filter((failure) => failure.message.includes('H1')).length,
  missingTitles: failures.filter((failure) => failure.message.includes('title')).length,
  failures, warnings,
};
fs.writeFileSync(path.join(dist, 'seo-validation-report.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`SEO output verified: ${summary.routesChecked} routes checked; ${summary.passed} passed; ${summary.failed} failed; ${summary.warnings.length} warnings.`);
if (failures.length) process.exitCode = 1;
