# Production Validation

Validation date: 2026-08-29 (Asia/Calcutta)

## Deployment identity

- Observed deployed commit: `535aa91364c43ba6d924283e302031a0b4e4d616` (`feat(seo): Update SEO documentation and validation processes`). The production client asset hash matched the locally built asset.
- Deployment provider: Vercel (`Server: Vercel`, `X-Vercel-Id` present). `main` and `origin/main` were identical before validation.
- Deployment completion time is not exposed without Vercel project access; production reported `Last-Modified: 2026-08-29T17:51:27Z`.
- Catalogue source: production API, `https://new-delhi-electricals.onrender.com`.
- Current local build inventory: 1,986 API products, 1,918 generated canonical products, 32 duplicate canonical collisions excluded, 6 categories, 5 brands, 1,936 indexable routes. Fallback: not used.

## Local release gate

- `npm ci`: passed after clearing a stale Windows dependency-directory cleanup race. Lighthouse warns that Node 22.14 is below its declared 22.19 engine, but runs successfully.
- `npm run build`: passed. React SSR SEO generation used the production API.
- `npm test`: passed — 1,936 canonical routes, 1,936 passed, 0 warnings.
- `npm run test:browser`: passed — 15 tests. It includes route hydration, mobile navigation, cart, variant, WhatsApp-handoff and conversion-dispatch checks.
- `git diff --check`: passed.
- An ad-hoc `npx tsc --noEmit -p tsconfig.app.json` fails on pre-existing unrelated application type errors. There is no configured typecheck script; this remains P1 work outside the recovered SSR change set.

## HTTP validation

| Route | HTTP status | Redirect | Final URL |
| --- | ---: | --- | --- |
| `/` | 200 | — | `/` |
| `/category/switches-sockets` | 200 | — | same |
| `/brand/havells` | 200 | — | same |
| `/havells/2-channel-dimmer-2m-grey` | 200 | — | same |
| `/finolex/finolex-fr-0-75-sqmm-300m-house-wire` | 200 | — | same |
| `/search?q=switch` | 200 | — | same; `noindex, follow` |
| `/cart`, `/shortlist`, `/compare` | 200 | — | same; `noindex, follow` |
| `/admin` | 404 | — | same; no public admin document exposed |
| invalid public/product/category routes | 404 | — | same |
| `/category/switches` | 308 | one permanent hop | `/category/switches-sockets` |
| `/product/anchor/1-module-cover-plate-aqua-green-color-finish` | 308 | one permanent hop | `/anchor/1-module-cover-plate-aqua-green-color-finish` |

## Raw SSR and hydration

Raw, JavaScript-free responses for home, category, brand, Havells product and Finolex product each had a route-specific title, description, HTTPS `www` canonical, meaningful React-rendered body, H1, crawlable internal anchors, `window.__NDE_INITIAL_ROUTE_DATA__` and route-appropriate JSON-LD. No response contained `.seo-static-shell`.

The in-app browser loaded the same five routes after JavaScript execution. H1, canonical and schema matched the route document; breadcrumb navigation was present on category, brand and products. Browser console diagnostics were empty: hydration mismatch warnings 0, root replacement warnings 0, uncaught page errors 0.

## API and CORS

The deployed API is reachable from the production origin. `GET /api/products?pageSize=1&is_active=true` with `Origin: https://www.newdelhielectricals.com` returned 200 and `access-control-allow-origin: https://www.newdelhielectricals.com`, `access-control-allow-credentials: true`, and `Vary: Origin`. Browser route loads emitted no CORS or request-failure diagnostics. Initial public documents use embedded route data, so no unnecessary catalogue request was observed during the tested initial renders.

## CLS and mobile Lighthouse

Local browser-suite CLS values were Home 0.002106, Category 0.002116, Brand 0.017030, Havells product 0.001290 and Finolex product 0.001290. Production Lighthouse lab CLS was 0 for sampled home/category/brand/product routes; all are within the 0.1 release budget.

| Route | Performance | SEO | LCP | CLS | TBT | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 82 | 100 | 3.49 s | 0 | 0 ms | 4.64 s |
| Category | 83 | 100 | 3.48 s | 0 | 0 ms | 4.60 s |
| Brand | 84 | 100 | 3.49 s | 0 | 0 ms | 3.24 s |
| Product | 85 | 100 | 3.48 s | 0 | 0 ms | 3.18 s |

## Sitemap, robots, canonicals and schema

- `sitemap.xml` is valid XML with 1,936 unique HTTPS `www` URLs. It has no utility, admin, query, duplicate or fabricated `lastmod` entries. Twenty representative sitemap URLs returned 200.
- `robots.txt` allows crawlable public resources, disallows `/admin` and `/api/`, and references `https://www.newdelhielectricals.com/sitemap.xml`.
- Normal, `utm_source`, `gclid` and `fbclid` category URLs all canonicalize to the clean category URL. Search canonicalizes to `/search` and remains `noindex, follow`.
- Home emits `LocalBusiness`; category and brand emit `BreadcrumbList`; products emit `Product` plus `BreadcrumbList`. Checked product JSON-LD has no `Offer`, availability, `InStock`, rating, review, or `priceValidUntil` claims.

## Measurement systems

- Application conversion-event contract: verified by the 15-test browser suite. Generic WhatsApp emits exactly `whatsapp_click`, `whatsapp_enquiry_start`; cart quotation handoff emits exactly `quote_enquiry_start`, `whatsapp_click`, `whatsapp_enquiry_start`, `quote_enquiry_handoff`; the telephone CTA emits `phone_click`. Test payload checks reject form values, search text and WhatsApp message contents.
- Vercel ingestion: not asserted. The test environment can verify dispatch, not account-level ingestion.
- GA4/GTM: not installed. Repository and production asset inspection found no `gtag`, Google Tag Manager container or measurement ID. Do not invent one.
- Google Search Console: unavailable in this environment; no historical baseline was fabricated.

## Remaining issues

### P0

None found in the checked production release path.

### P1

- Repair the existing full TypeScript errors before introducing a required typecheck release gate.
- Obtain Search Console access to capture the requested historical/search-index baseline and submit/inspect the sitemap.
- Verify Vercel Analytics ingestion in the account debugger after normal real-user traffic; dispatch alone is not ingestion evidence.
