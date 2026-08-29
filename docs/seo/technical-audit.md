# Technical SEO Audit

Audit date: 2026-08-27. All findings below are based on repository inspection, local production output, direct HTTP responses or recorded command output.

> Recovery addendum — 2026-08-29: the local checkout now has React SSR/prerendering, strict production-API catalogue loading, safe opt-in-only fallback, and browser hydration coverage. The old shell generator was removed. The local build, full route validation and representative browser tests pass; production deployment remains intentionally withheld.

## Issue

### Priority

P0

### Problem

SEO-critical routes were client-rendered. The initial document did not contain the route-specific title, canonical, H1, product/category/brand content, crawlable catalogue links or schema.

### Evidence

- `frontend/src/main.tsx` uses `createRoot`; `frontend/src/App.tsx` uses `BrowserRouter`.
- `frontend/src/components/SEOHead.tsx` used `useEffect` to create metadata after JavaScript execution.
- On 2026-08-27, direct requests to the live homepage, category, brand, search, admin and a nonexistent route each returned the same 2,498-byte HTML shell. Category and brand raw responses had no canonical, H1 or JSON-LD.
- Before this change, `npm run build` produced one deployable HTML document: `dist/index.html`.

### SEO Impact

Search systems had to execute JavaScript and wait for API calls before discovering commercial content. This reduces crawl reliability and made important route types indistinguishable in raw HTML.

### Recommended Solution

Generate route-specific static HTML from verified catalogue data at build time and keep the React application for interactive browsing.

### Implementation Status

Fixed in build output; production deployment verification is still required.

### Files Changed

- `frontend/package.json`
- `frontend/scripts/generate-seo.js`
- `frontend/scripts/test-seo-output.js`

### How It Was Tested

- `npm run build`
- `npm test`
- Direct local preview requests to `/`, `/category/switches-sockets`, `/brand/havells` and `/havells/2-channel-dimmer-2m-grey`.

## Issue

### Priority

P0

### Problem

The live hosting rewrite served `index.html` with HTTP 200 for a deliberately nonexistent route, creating a soft 404. It also served the application shell for every unknown public route.

### Evidence

- Direct request to `https://www.newdelhielectricals.com/definitely-not-a-real-page-seo-audit` returned HTTP 200 and the 2,498-byte application shell.
- The prior `frontend/vercel.json` and root `vercel.json` rewrote nearly every path to `/index.html`.

### SEO Impact

Search engines can treat invalid URLs as duplicate/low-quality pages and waste crawl resources.

### Recommended Solution

Serve generated clean URLs as static files, restrict SPA rewrites to admin routes, and allow unknown public URLs to resolve as platform 404 responses.

### Implementation Status

Partially fixed. The Vercel configuration is changed, but a deployed HTTP check is required because local Vite preview does not emulate Vercel routing.

### Files Changed

- `frontend/vercel.json`
- `vercel.json`
- `frontend/scripts/generate-seo.js`

### How It Was Tested

- Configuration inspection.
- `npm test` confirms `dist/404.html` exists and generated sitemap output excludes invalid routes.

## Issue

### Priority

P0

### Problem

The production API hostname in `frontend/.env.production` returned `DEPLOYMENT_NOT_FOUND` for `/health`, products, brands and categories.

### Evidence

- Requests to the configured production API returned HTTP 404 with Vercel `DEPLOYMENT_NOT_FOUND`.
- The current live frontend bundle referenced a separate public API host, which responded with HTTP 200 to `/health`, `/api/products`, `/api/products/brands` and `/api/products/categories`.

### SEO Impact

Client-rendered catalogue pages could fail to hydrate product data. Build-time generation would also fail if it depended only on the invalid host.

### Recommended Solution

Use the working public catalogue API in the production build configuration and make generation fail over to the repository export if the API is unavailable.

### Implementation Status

Fixed locally; deployment environment variables must match the corrected configuration.

### Files Changed

- `frontend/.env.production`
- `frontend/scripts/generate-seo.js`

### How It Was Tested

- HTTP requests to both candidate public API hosts.
- `npm run build` generated 1,972 canonical indexable routes from the production API.

## Issue

### Priority

P1

### Problem

Canonical handling was browser-only and used the full current URL, retaining query parameters. The sitemap used the non-preferred hostname, had only 10 static entries, included user-specific utility pages and set every `lastmod` to generation date.

### Evidence

- Prior `SEOHead.tsx` set canonical to `window.location.href`.
- Prior `frontend/scripts/generate-sitemap.js` defined 10 static paths, including `/cart`, `/shortlist` and `/compare`, and used `https://newdelhielectricals.com`.
- Direct HTTP checks confirm HTTPS `www` is the preferred host.

### SEO Impact

Query, filter and utility URLs can cause duplicate-indexation signals, while commercial product routes were omitted from discovery.

### Recommended Solution

Use absolute `www` canonicals based on the path only, mark utility/search pages noindex, and generate a sitemap from canonical catalogue routes without fabricated `lastmod` values.

### Implementation Status

Fixed in build output; deploy and submit the generated sitemap.

### Files Changed

- `frontend/src/components/SEOHead.tsx`
- `frontend/src/lib/seo.ts`
- `frontend/public/robots.txt`
- `frontend/scripts/generate-seo.js`
- `frontend/index.html`

### How It Was Tested

- `npm test` verifies absolute canonicals, noindex search output and sitemap exclusions.
- `frontend/dist/sitemap.xml` contained 1,972 URLs after the build.

## Issue

### Priority

P1

### Problem

Search, cart, shortlist and compare pages had no consistent noindex directive. Admin pages were only disallowed in robots.txt, while the frontend shell remained publicly reachable.

### Evidence

- `/search?q=switch` and `/admin` returned the same indexable-looking raw live HTML shell.
- `frontend/src/lib/seo.ts` did not assign robots values to utility pages.
- Existing `robots.txt` disallowed `/admin`, which is not access control or a reliable noindex mechanism.

### SEO Impact

Search/facet and user-state pages can add low-value URLs to the index. Robots disallow alone cannot ensure that an already discovered URL is removed from results.

### Recommended Solution

Generate noindex utility pages and send an `X-Robots-Tag` for the admin SPA shell. Maintain backend authentication for admin protection.

### Implementation Status

Fixed in source and build output; verify production headers after deployment.

### Files Changed

- `frontend/src/lib/seo.ts`
- `frontend/scripts/generate-seo.js`
- `frontend/vercel.json`
- `vercel.json`

### How It Was Tested

- `npm test` checks generated search output contains `noindex, follow` and sitemap excludes search/cart/admin.

## Issue

### Priority

P1

### Problem

There was no build-time schema implementation and no Product or BreadcrumbList schema in raw route HTML.

### Evidence

- Direct raw live responses contained no `application/ld+json`.
- No schema generator was found in the repository before this sprint.

### SEO Impact

Search engines had no reliable structured description of the organisation, product identity or breadcrumb hierarchy before JavaScript.

### Recommended Solution

Add factual LocalBusiness, Product, Offer and BreadcrumbList JSON-LD to generated HTML, using only repository/API fields. Do not claim availability, ratings or reviews.

### Implementation Status

Fixed.

### Files Changed

- `frontend/scripts/generate-seo.js`
- `frontend/src/lib/seo.ts`
- `frontend/src/components/SEOHead.tsx`
- `frontend/src/pages/ProductSlugPage.tsx`

### How It Was Tested

- `npm test` asserts LocalBusiness schema on home, BreadcrumbList on category/brand, Product and Offer on a priced product, and rejects `InStock`, `aggregateRating` and review data.

## Issue

### Priority

P1

### Problem

Legacy category and product URL patterns could coexist with canonical catalogue URLs.

### Evidence

- `frontend/src/config/shoppingCategories.ts` contained legacy category mappings.
- `frontend/src/App.tsx` accepted three product route shapes: `/:brand/:slug`, `/product/:brand/:slug` and `/product/:brand/:product_family/:slug`.

### SEO Impact

Equivalent routes can split links, crawl budget and canonical signals.

### Recommended Solution

Redirect known legacy category paths and legacy product route patterns in one permanent hop to the canonical clean URL.

### Implementation Status

Fixed in Vercel configuration; production redirect tests are pending deployment.

### Files Changed

- `frontend/vercel.json`
- `vercel.json`

### How It Was Tested

- Configuration inspection and generated canonical URL inspection.

## Issue

### Priority

P2

### Problem

WhatsApp and form conversion handling was distributed across components. Vercel page views were present, but there was no shared non-PII event taxonomy or reliable central event for every CTA.

### Evidence

- `frontend/src/App.tsx` mounted `@vercel/analytics/react`.
- `frontend/src/hooks/useAnalytics.ts` stored WhatsApp counts locally in browser storage.
- `rg` found multiple direct `window.open` WhatsApp calls across home, brand, product, cart and utility components.

### SEO Impact

The business could not consistently connect organic landing pages to WhatsApp and quotation conversions.

### Recommended Solution

Add a shared custom-event helper, one delegated CTA listener and explicit form success/handoff events without PII.

### Implementation Status

Fixed.

### Files Changed

- `frontend/src/lib/conversionTracking.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/ContactPage.tsx`
- `frontend/src/pages/CartPage.tsx`
- `docs/seo/conversion-tracking.md`

### How It Was Tested

- Production build confirms `@vercel/analytics/react` custom-event imports resolve.
- TypeScript limits event properties to scalar values.

## Issue

### Priority

P2

### Problem

Plain `npm ci` failed because `vite-imagetools@12` required Vite 8 while the repository uses Vite 7. The image plugin was configured but no source imports used its query-based transforms.

### Evidence

- `npm ci` returned an `ERESOLVE` peer dependency conflict between Vite 7.3.6 and `vite-imagetools@12.0.0`.
- `frontend/vite.config.ts` loaded the plugin.
- Repository search found no image-tool query usage.

### SEO Impact

This did not directly change ranking, but it made reproducible production builds and deployments less reliable.

### Recommended Solution

Remove the unused incompatible plugin rather than force a Vite major-version upgrade.

### Implementation Status

Fixed.

### Files Changed

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.ts`

### How It Was Tested

- `npm install --package-lock-only`
- `npm run build`

## Issue

### Priority

P2

### Problem

Public-route JavaScript remains sizable and the homepage/brand mobile Lighthouse lab results show high blocking time. Image attributes are inconsistent: catalogue cards use `LazyImage`, but several direct images lack verified dimensions.

### Evidence

- Pre-change live mobile Lighthouse: home TBT 3,700 ms; brand TBT 990 ms.
- Final build still has a 205.87 kB main entry (61.48 kB gzip) plus animation, UI and React vendor chunks.
- `frontend/src/components/catalog/ProductCard.tsx` uses `LazyImage`; direct image elements also occur in hero/product and utility pages.

### SEO Impact

Long main-thread work and unsized images can delay content and increase layout instability on mobile.

### Recommended Solution

Profile public routes after deployment, defer noncritical animation where justified, and add actual media dimensions/responsive renditions from the source system.

### Implementation Status

Partially fixed. Existing lazy catalogue-image behavior was preserved; no image dimensions were invented.

### Files Changed

- `frontend/vite.config.ts`

### How It Was Tested

- Final local-preview Lighthouse reports were captured for home/category/brand/product, but are not a like-for-like replacement for the live baseline and are documented in the implementation report.
