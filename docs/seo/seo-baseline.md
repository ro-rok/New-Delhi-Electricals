# SEO Baseline

Baseline date: 2026-08-27 (Asia/Calcutta)

## Repository and application

- Git branch: `main`.
- Working tree was clean before this sprint.
- Frontend: React 18.3.1, React DOM 18.3.1, React Router DOM 6.30.6 and Vite 7.3.6 as resolved by `package-lock.json`.
- Backend: FastAPI with MongoDB access through Motor. Public catalogue endpoints are defined in `backend/app/routes/products.py`; admin authentication is applied to protected backend routes.
- Routing: `BrowserRouter` in `frontend/src/App.tsx`. It defines 16 public route patterns, admin route patterns and a catch-all React not-found component.
- Data: products, categories and brands are loaded from the public FastAPI catalogue API. The repository also contains a 1,994-product export at `backend/app/parsing/output/all_products_full.json`.
- Build: npm and Vite. The pre-change build produced one deployable HTML shell (`dist/index.html`); `dist/stats.html` is only a bundle report.
- Deployment: Vercel configuration exists at both repository root and `frontend/vercel.json`. The live frontend returns Vercel response headers. The API used by the deployed browser bundle is hosted separately.
- Blog/article routes: none found.

## Catalogue inventory verified during the build

- Production API products returned for active-product generation: 1,990.
- Canonical active products with a usable name, brand and URL: 1,954.
- Commercial category routes: 6.
- Brands with active catalogue inventory: 5 (Anchor, Finolex, Havells, Lauritz Knudsen and Polycab).
- Generated canonical indexable routes: 1,972.
- Generated noindex utility routes: 4.

Counts above are recorded in `frontend/dist/seo-build-report.json` by `frontend/scripts/generate-seo.js`. They may change when catalogue data changes.

## Pre-change live crawl baseline

Direct `curl` requests on 2026-08-27 showed that `/`, `/category/switches-sockets`, `/brand/havells`, `/search?q=switch`, `/admin`, and a deliberately nonexistent URL all returned HTTP 200 with the same 2,498-byte HTML document. That document contained a default title and description but no canonical, H1, meaningful catalogue body, or JSON-LD.

- HTTP apex redirects to HTTPS apex with 308.
- HTTPS apex redirects to `https://www.newdelhielectricals.com/` with 307.
- HTTP `www` redirects to HTTPS `www` with 308.
- Preferred production host is therefore `https://www.newdelhielectricals.com`.
- A nonexistent client route returned the application shell with HTTP 200 (soft 404).
- Search and admin returned indexable-looking application HTML before JavaScript.
- The pre-change sitemap contained 10 static URLs, used the non-`www` host, included cart/shortlist/compare, omitted products/categories/brands, and assigned the build date as every `lastmod`.
- The pre-change `robots.txt` referenced the non-`www` sitemap and disallowed `/admin` and `/api/`.

## Metadata, schema and linking baseline

- `frontend/index.html` contained only homepage/default metadata.
- `frontend/src/components/SEOHead.tsx` changed title, description, social tags and canonical in `useEffect`, after JavaScript execution.
- Canonicals used `window.location.href`, retaining search and tracking query parameters.
- Product, category, brand, search and static page metadata helpers existed in `frontend/src/lib/seo.ts`.
- No server/build-time schema architecture existed.
- Standard React Router `Link` components are used in the header, footer, category, brand and product interfaces; they render crawlable anchors after React renders.
- Category pages had visible breadcrumbs. Product pages did not have a visible breadcrumb trail.

## Analytics and conversion baseline

- `@vercel/analytics` was mounted in `frontend/src/App.tsx` for automatic page-view collection.
- No GA4 or Google Tag Manager code was found.
- `frontend/src/hooks/useAnalytics.ts` stored page/product/search/category/WhatsApp counters only in each browser's local storage; those values were not a central conversion dataset.
- The backend admin analytics endpoints aggregate inquiries, quotations and admin logs. They do not represent Google Analytics traffic.
- WhatsApp calls were spread across product, brand, home, shortlist, cart and utility components. Only some called the local counter.
- The contact form submits to `/api/inquiries`. No predictable, shared non-PII conversion event layer existed.

## Rendering and performance baseline

Pre-change mobile Lighthouse runs against the live site produced the following lab results. Lighthouse completed reports but exited with a Windows temporary-directory cleanup `EPERM`; JSON reports were still written and parsed.

| Route type | Performance | SEO | LCP | CLS | TBT | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 49 | 100 | 4.0 s | 0.101 | 3,700 ms | 4.5 s |
| Category | 92 | 100 | 2.6 s | 0.038 | 60 ms | 3.6 s |
| Brand | 53 | 100 | 4.4 s | 0 | 990 ms | 6.5 s |
| Product | 77 | 100 | 4.0 s | 0.011 | 270 ms | 3.8 s |

The Lighthouse SEO score reflects the browser-rendered DOM, not the empty initial HTML response.

Pre-change production build: 73.66 seconds, 100 files, 4,163,132 bytes including `stats.html`, and one deployable route HTML document.

## External data availability

Google Search Console data unavailable in repository environment.

GA4 data unavailable in repository environment.

## 2026-08-29 final release-gate addendum

This checkout cannot be treated as a production-ready SSR release. The documented historical build output is not a substitute for the final gate: `frontend/node_modules` is absent, so `npm run build` cannot invoke Vite; the SEO test consequently cannot find `dist/seo-build-report.json`; and `package.json` has no `test:browser` script or Playwright test assets. No production deployment or production validation was performed.

The checked-in generator also contains a repository catalogue fallback and injects a `.seo-static-shell`, both of which conflict with the required release criteria. Google Search Console access remains unavailable in this environment; no metrics or indexing figures were invented.

SEMrush data unavailable in repository environment.

PageSpeed field/CrUX data unavailable in repository environment.
