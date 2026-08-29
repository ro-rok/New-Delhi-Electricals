import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const site = 'https://www.newdelhielectricals.com';
const build = JSON.parse(fs.readFileSync(path.join(dist, 'seo-build-report.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>https:\/\/www\.newdelhielectricals\.com([^<]*)<\/loc>/g)].map(match => match[1] || '/');
const failures = []; const warnings = []; const counters = { missingTitle: 0, missingH1: 0, schemaErrors: 0, canonicalErrors: 0 };

function outputPath(route) { return route === '/' ? path.join(dist, 'index.html') : path.join(dist, `${route.replace(/^\//, '')}.html`); }
function fail(route, message) { failures.push({ route, message }); }
function schemas(html, route) {
  const results = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { results.push(JSON.parse(match[1])); } catch { counters.schemaErrors++; fail(route, 'invalid JSON-LD'); }
  }
  return results;
}
for (const route of routes) {
  const filename = outputPath(route);
  if (!fs.existsSync(filename)) { fail(route, 'generated document missing'); continue; }
  const html = fs.readFileSync(filename, 'utf8');
  if (!/^<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html)) fail(route, 'invalid HTML document');
  if (!/<title>[^<]+<\/title>/i.test(html)) { counters.missingTitle++; fail(route, 'missing title'); }
  const canonical = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"[^>]*>/gi)].map(match => match[1]);
  if (canonical.length !== 1 || canonical[0] !== `${site}${route}`) { counters.canonicalErrors++; fail(route, 'canonical is missing, duplicated, or incorrect'); }
  if (!/^https:\/\/www\.newdelhielectricals\.com\//.test(canonical[0] || '')) { counters.canonicalErrors++; fail(route, 'canonical must be HTTPS www'); }
  if (!/<h1(?:\s[^>]*)?>[^<]+<\/h1>/i.test(html)) { counters.missingH1++; fail(route, 'missing H1'); }
  if (!/<main(?:\s[^>]*)?>[\s\S]*\S[\s\S]*?<\/main>/i.test(html)) fail(route, 'missing meaningful root content');
  if (/\.seo-static-shell/i.test(html)) fail(route, 'obsolete fake SEO shell present');
  if (/noindex/i.test(html)) fail(route, 'indexable sitemap document is noindex');
  const jsonLd = schemas(html, route);
  if (!jsonLd.length && route === '/') fail(route, 'home page missing JSON-LD');
  for (const schema of jsonLd) {
    const serialized = JSON.stringify(schema);
    if (/"@type":"Offer"|"availability"|"aggregateRating"|"review"|"priceValidUntil"|"gtin"|"mpn"/i.test(serialized)) fail(route, 'unsupported schema property');
  }
}
for (const route of ['/search', '/cart', '/shortlist', '/compare']) {
  const html = fs.readFileSync(outputPath(route), 'utf8');
  if (!/noindex, follow/i.test(html)) fail(route, 'utility route must be noindex');
  if (sitemap.includes(`<loc>${site}${route}</loc>`)) fail(route, 'utility route must not be in sitemap');
}
if (/Disallow: \/assets/i.test(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8'))) fail('robots.txt', 'render assets are blocked');
const report = { routesChecked: routes.length, passed: routes.length - new Set(failures.map(item => item.route)).size, failed: failures.length, warnings: warnings.length, ...counters, failures, warningDetails: warnings };
fs.writeFileSync(path.join(dist, 'seo-validation-report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) throw new Error(`SEO validation failed for ${new Set(failures.map(item => item.route)).size} route(s). See dist/seo-validation-report.json.`);
console.log(`SEO output verified: ${report.routesChecked} canonical routes, ${report.passed} passed, ${report.warnings} warnings.`);
