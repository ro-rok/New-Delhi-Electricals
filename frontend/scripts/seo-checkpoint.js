/**
 * Live production SEO checkpoint for the strategic watchlist.
 *
 * Crawls the pages that Prompt 3 and Prompt 4 shipped, as Googlebot, and records what is
 * verifiable without Search Console: HTTP status, canonical, robots directive, indexable
 * SSR word count, schema types and sitemap membership.
 *
 * This measures crawlability, not indexation. Whether Google has *indexed* a URL can only
 * come from Search Console; those fields stay PENDING here by design.
 *
 * Usage: node scripts/seo-checkpoint.js [--label day-7]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, '../docs/seo/checkpoints');
const siteUrl = 'https://www.newdelhielectricals.com';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const labelArg = process.argv.indexOf('--label');
const label = labelArg > -1 ? process.argv[labelArg + 1] : `checkpoint-${new Date().toISOString().slice(0, 10)}`;

/** The watchlist. Keep this list short and strategic — it is not a site crawl. */
const WATCHLIST = [
  { path: '/', type: 'home' },
  { path: '/brand/polycab/wires-cables', type: 'commercial-hub' },
  { path: '/brand/finolex/wires-cables', type: 'commercial-hub' },
  { path: '/brand/anchor/switches-sockets', type: 'commercial-hub' },
  { path: '/brand/havells/switches-sockets', type: 'commercial-hub' },
  { path: '/brand/finolex', type: 'brand' },
  { path: '/brand/havells', type: 'brand' },
  { path: '/category/wires-cables', type: 'category' },
  { path: '/category/circuit-protection', type: 'category' },
  { path: '/category/switches-sockets', type: 'category' },
  { path: '/category/plates', type: 'category' },
  { path: '/category/geysers', type: 'category' },
  { path: '/guides', type: 'guides-index' },
  { path: '/guides/best-wire-for-house-wiring', type: 'guide' },
  { path: '/guides/genuine-finolex-wire', type: 'guide' },
  { path: '/guides/mcb-vs-mccb', type: 'guide' },
  { path: '/guides/how-to-choose-mcb-for-home', type: 'guide' },
  { path: '/guides/rccb-explained', type: 'guide' },
];

function pick(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}
function schemaTypesOf(html) {
  return [...new Set([...html.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)].map((m) => m[1]))].sort();
}
function visibleWordCount(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  return body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

async function fetchSitemap() {
  const res = await fetch(`${siteUrl}/sitemap.xml`, { headers: { 'user-agent': GOOGLEBOT } });
  if (!res.ok) return { total: 0, locs: new Set(), error: `HTTP ${res.status}` };
  const xml = await res.text();
  const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  return { total: locs.size, locs };
}

async function inspect(entry, sitemapLocs) {
  const url = `${siteUrl}${entry.path}`;
  const row = { ...entry, url };
  try {
    const res = await fetch(url, { headers: { 'user-agent': GOOGLEBOT }, redirect: 'follow' });
    const html = await res.text();
    row.status = res.status;
    row.finalUrl = res.url;
    row.title = pick(html, /<title>([\s\S]*?)<\/title>/i)?.trim() ?? null;
    row.titleLength = row.title ? row.title.length : 0;
    row.description = pick(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
    row.descriptionLength = row.description ? row.description.length : 0;
    row.canonical = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
    row.robots = pick(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
    row.schemaTypes = schemaTypesOf(html);
    row.ssrWords = visibleWordCount(html);
  } catch (err) {
    row.status = 0;
    row.error = String(err.message ?? err);
  }
  row.inSitemap = sitemapLocs.has(url);
  row.selfCanonical = row.canonical === url;
  row.indexable = row.status === 200 && row.selfCanonical && !/noindex/i.test(row.robots ?? '');
  // Indexation is a Search Console fact. Never inferred here.
  row.gscIndexStatus = 'PENDING';
  return row;
}

const sitemap = await fetchSitemap();
const rows = [];
for (const entry of WATCHLIST) rows.push(await inspect(entry, sitemap.locs));

const capturedAt = new Date().toISOString();
const problems = rows.filter((r) => !r.indexable || !r.inSitemap);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, `${label}.json`),
  JSON.stringify({ label, capturedAt, siteUrl, sitemapTotal: sitemap.total, rows }, null, 2),
);

const md = [
  `# SEO checkpoint — ${label}`,
  '',
  `Captured ${capturedAt} against production. Crawled as Googlebot.`,
  '',
  `Sitemap URLs live: **${sitemap.total}**`,
  '',
  '> This checkpoint proves crawlability and on-page state only. Indexation, impressions,',
  '> clicks and position require Search Console and are recorded as PENDING until exported.',
  '',
  '| Page | Type | HTTP | Self-canonical | Robots | SSR words | Schema | In sitemap | GSC index |',
  '|---|---|---:|---|---|---:|---|---|---|',
  ...rows.map((r) =>
    `| \`${r.path}\` | ${r.type} | ${r.status} | ${r.selfCanonical ? 'yes' : '**NO**'} | ${r.robots ?? '—'} | ${r.ssrWords ?? 0} | ${(r.schemaTypes ?? []).join(', ') || '—'} | ${r.inSitemap ? 'yes' : '**NO**'} | ${r.gscIndexStatus} |`,
  ),
  '',
  problems.length
    ? `## Problems\n\n${problems.map((r) => `- \`${r.path}\` — status ${r.status}, canonical ${r.canonical ?? 'none'}, inSitemap ${r.inSitemap}`).join('\n')}`
    : '## Problems\n\nNone. Every watchlist URL returns 200, is self-canonical, is indexable and is in the sitemap.',
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, `${label}.md`), md);

console.log(md);
console.log(`\nWrote ${path.join(outDir, label)}.{json,md}`);
if (problems.length) process.exitCode = 1;
