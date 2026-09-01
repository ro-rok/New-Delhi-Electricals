# New Delhi Electricals — SEO Day-0 Baseline

Baseline date: 2026-08-28 (Asia/Kolkata; repository checks completed during the local afternoon)

Repository commit: `a94f126da1afc4bc5279759e579ed119f998531a`

Production domain: `https://www.newdelhielectricals.com`

Primary market: Delhi NCR

Primary conversion: WhatsApp enquiry; quotation/form enquiry; telephone enquiry where applicable

This is the Day-0 measurement record. It documents verified repository, build and live-HTTP facts only; it does not infer Google performance from generated URL counts or third-party estimates.

## 1. Data Sources

| Source | Status | Date | Reliability / limitation |
| --- | --- | --- | --- |
| Repository and Git | Captured | 2026-08-28 | Authoritative for source architecture and working-tree state. |
| Production catalogue API build report | Captured | 2026-08-28 | Authoritative for the local build snapshot; inventory is live and can change between builds. |
| Production/live HTTP | Captured | 2026-08-28 | Direct unauthenticated checks of representative HTML, robots, sitemap, redirects and 404 behaviour; not a Search Console index report. |
| Google Search Console | Insufficient data | Connected 2026-08-27 | No accessible GSC datasets in this environment and insufficient history for performance reporting. |
| SEMrush | Unavailable | 2026-08-28 | No connected Semrush account, export or verified current snapshot was available. |
| Local static-output validation | Captured | 2026-08-28 | `npm run test:seo` checked every route in the fresh local build. |
| Local browser validation | Partly captured | 2026-08-27 / 2026-08-28 | The recorded 2026-08-27 suite passed. A Day-0 rerun could not start because the local test server throws `TypeError: relative is not a function` under Node 24.11.1. |
| Lighthouse | Historical only | 2026-08-27 | Pre-change live mobile lab results are recorded below; no Day-0 preview Lighthouse run exists. |
| Vercel Analytics | Implemented, ingestion unverified | 2026-08-28 | Repository code proves implementation, not account entitlement or production event ingestion. |
| GA4 | Not found | 2026-08-28 | No GA4 or Google Tag Manager implementation was found in repository code. |

## 2. Application Architecture

- Frontend dependencies resolved by the current build: React and React DOM `18.3.1`, React Router DOM `6.30.1`, Vite `7.3.6`.
- Build command: `vite build`, followed by `vite build --ssr src/entry-server.tsx --outDir dist/server`, then `scripts/generate-seo.js`.
- Rendering: Vite SSR renders the same `AppContent` React tree with `StaticRouter`; the build writes static HTML for indexable routes and serializes route-scoped initial catalogue data.
- Routing: the browser application uses `BrowserRouter`; documents with prerendered root content use `hydrateRoot`, while client-only empty roots use `createRoot`.
- Backend/API: FastAPI routes provide the public products, brands and categories API. The fresh build used `https://new-delhi-electricals.onrender.com` as its production catalogue API source.
- Hosting: equivalent root `vercel.json` and `frontend/vercel.json` configurations specify clean URLs, legacy redirects, an admin rewrite and an `X-Robots-Tag` for admin routes. The deployed origin returned Vercel-style production responses during HTTP checks.
- Deployment assumption: a deployment must run the frontend build with its production API configuration. Because the catalogue is live, route totals must be read from that build's report rather than assumed to be permanent.

### Repository state

- Branch: `main`.
- Commit: `a94f126da1afc4bc5279759e579ed119f998531a`.
- Working tree: not clean. It contains uncommitted SEO implementation/documentation, prerendering, routing, analytics and test changes, plus unrelated `.gitignore` changes. Nothing was discarded, pushed or deployed for this baseline.
- SEO-relevant structure: `frontend/src/entry-server.tsx`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/scripts/generate-seo.js`, `frontend/src/lib/seo.ts`, `frontend/public/robots.txt`, Vercel configuration, FastAPI routes, and `docs/seo/` validation records.

## 3. Catalogue / Route Baseline

Fresh local build report, sourced from the production API on 2026-08-28:

- Active API products loaded: **1,986**.
- Canonical product routes generated: **1,950**.
- Excluded/collision products: **36**, all recorded as `duplicate canonical` in `dist/seo-excluded-products.json`.
- Commercial category routes: **6**.
- Inventory-backed brand routes: **5** — Anchor, Finolex, Havells, Lauritz Knudsen and Polycab.
- Indexable generated routes: **1,968** (`1,950 + 6 categories + 5 brands + 7 static indexable routes`).
- Noindex utility routes generated: **4** — `/search`, `/cart`, `/shortlist`, `/compare`.

The currently deployed sitemap contained **1,972** URLs in the same Day-0 HTTP check. It is four URLs above the fresh build because the production catalogue changed while the API-backed build was run; this is a snapshot/deployment alignment difference, not evidence that Google has indexed either total.

## 4. Rendering Baseline

### Pre-SEO original state

The prior live crawl evidence recorded a single client application shell for public routes. Initial HTML did not reliably expose route-specific H1s, canonical tags, catalogue body content or JSON-LD, and unknown public URLs returned a soft 404.

### Current implemented state

- The prerender generator produces full React HTML from `AppContent`; no handcrafted `seo-static-shell` is used.
- Route-scoped initial data is embedded in `window.__NDE_INITIAL_ROUTE_DATA__` and consumed during hydration.
- Representative generated documents passed for `/`, `/category/switches-sockets`, `/brand/havells`, `/havells/2-channel-dimmer-2m-grey` and `/finolex/finolex-fr-0-75-sqmm-300m-house-wire`: title, meta description, canonical, H1, meaningful body content, crawlable internal links and applicable JSON-LD were present.
- The same five representative URLs also passed those element-presence checks on the live domain on 2026-08-28.
- The 2026-08-27 browser record reports 0 hydration-mismatch warnings, 0 React root-replacement warnings and 0 SSR/hydration page errors across 7 tests. Treat that as historical local evidence only until the current browser-server failure is corrected and rerun.

## 5. Indexation Architecture

- Canonical paths use the HTTPS `www` hostname and route pathname; query strings are not retained in canonical URLs.
- `/search`, `/cart`, `/shortlist` and `/compare` are generated with `noindex, follow` and excluded from the sitemap.
- Admin is disallowed in robots and configured with `X-Robots-Tag: noindex, nofollow, noarchive`; robots rules are discovery directives, not access control. The live `/admin` check returned `404` with that header.
- Legacy category and product patterns are configured as permanent redirects. Live checks returned `308` for `/category/switches` to `/category/switches-sockets` and `/product/havells/2-channel-dimmer-2m-grey` to its clean canonical product URL.
- `dist/404.html` is generated; the live deliberately nonexistent public URL returned HTTP `404` on 2026-08-28.
- Internal navigation is rendered as crawlable anchors in the generated HTML.

## 6. Sitemap

### Local/build sitemap state

- Path: `frontend/dist/sitemap.xml` (published as `/sitemap.xml`).
- URLs: **1,968**.
- Canonical hostname: `https://www.newdelhielectricals.com` for every URL.
- Utility URLs included: no. Query URLs included: no. Admin URLs included: no.
- Duplicate locations: 0. `lastmod`: not used.
- Every sitemap URL corresponds to a generated indexable route: yes. `npm run test:seo` checked 1,968 routes with 0 failures and 0 warnings.

### Deployed live sitemap state

- URL: `https://www.newdelhielectricals.com/sitemap.xml`.
- URLs: **1,972**; all HTTPS `www`; 0 duplicate locations; no utility, query or admin URLs; no `lastmod` values.
- The live count differs from the fresh build as described in section 3. The complete live sitemap-to-file correspondence was not re-enumerated from the deployed filesystem.

### Google Search Console sitemap state

Unavailable / not yet verified in accessible GSC data. Do not infer submitted, processed or indexed status from the live sitemap response.

## 7. Robots.txt

- Source path: `frontend/public/robots.txt`; live path: `https://www.newdelhielectricals.com/robots.txt`.
- Rules: `Allow: /`, `Disallow: /admin`, `Disallow: /api/`.
- Sitemap reference: `https://www.newdelhielectricals.com/sitemap.xml`.
- Rendering resources are not disallowed by the current rules.
- API and admin crawling are discouraged; access protection remains the responsibility of application authentication and hosting controls, not robots.txt.

## 8. Metadata / Canonical

- Metadata is defined in `frontend/src/lib/seo.ts`, collected during SSR, emitted in the generated HTML head, and maintained after client navigation by `SEOHead`.
- Generated indexable routes have one title, one meta description and one canonical matching their sitemap URL; the full static-output validation passed.
- Canonicals intentionally remove query parameters by using a canonical route path.
- Utility routes have noindex metadata. The sitemap excludes them.

## 9. Structured Data

- Home: `LocalBusiness`.
- Category and brand pages: `BreadcrumbList`.
- Product pages: `Product` and `BreadcrumbList`.
- Current product schema intentionally omits Offer, availability, `InStock`, ratings, reviews and unsupported product identifiers. The static-output validator found 0 schema errors.

## 10. Google Search Console

Property connection date: **2026-08-27**.

Historical performance baseline unavailable because the Search Console property was only connected on 2026-08-27.

Performance history: **Insufficient data**. Phase 1 cannot reliably produce 28-day or prior-period comparisons, click/impression/CTR/position trends, top-query reports, top-page reports, branded/non-branded splits or GSC quick wins.

- Property verified: unavailable in accessible data.
- Submitted sitemap: unavailable in accessible data.
- Sitemap processed: unavailable in accessible data.
- Indexed page count: **Insufficient data**.
- Non-indexed page count: **Insufficient data**.
- Crawl data and URL Inspection results: unavailable in accessible data.

## 11. SEMrush External Visibility

No verified current Semrush data was available in the repository or connected tooling on 2026-08-28.

- Total organic keywords: unavailable.
- Estimated organic traffic: unavailable.
- Positions 1–3 / 4–10 / 11–20: unavailable.
- Ranking pages and strongest relevant commercial keyword: unavailable.

Any future Semrush figures must be labelled **SEMrush estimates**, never analytics traffic or Search Console clicks.

## 12. Analytics / Conversion Tracking

- Vercel Analytics: installed (`@vercel/analytics` `2.0.1`) and mounted in `App.tsx`; production ingestion and custom-event entitlement are unverified.
- Backend tracking: implemented through `/api/tracking/event` for page views, product views, WhatsApp clicks and searches; no production data export was available.
- GA4: **GA4 implementation not found in repository.**
- Google Tag Manager: not found in repository.
- Phone tracking: implemented as `phone_click`; browser event delivery is unverified.
- WhatsApp tracking: implemented as `whatsapp_click` and `whatsapp_enquiry_start`; browser event delivery is unverified.
- Quote/form tracking: implemented; browser event delivery is unverified.

Implemented Vercel custom-event taxonomy:

| Event | Implemented | Browser tested | Production ingestion verified |
| --- | --- | --- | --- |
| `whatsapp_click` | Yes | Historical CTA-path test only | No |
| `whatsapp_enquiry_start` | Yes | Historical CTA-path test only | No |
| `quote_enquiry_start` | Yes | No successful Day-0 suite run | No |
| `quote_enquiry_submit` | Yes | No successful Day-0 suite run | No |
| `quote_enquiry_handoff` | Yes | Historical cart-path test only | No |
| `contact_form_submit` | Yes | No live submission performed | No |
| `phone_click` | Yes | No successful Day-0 suite run | No |

No historical conversion dataset was available. Baseline conversions: **unavailable**.

## 13. Performance

### Pre-change production Lighthouse

Historical mobile Lighthouse lab evidence from 2026-08-27: Home — performance 49, SEO 100, LCP 4.0 s, CLS 0.101, TBT 3,700 ms, Speed Index 4.5 s; Category — 92, 100, 2.6 s, 0.038, 60 ms, 3.6 s; Brand — 53, 100, 4.4 s, 0, 990 ms, 6.5 s; Product — 77, 100, 4.0 s, 0.011, 270 ms, 3.8 s. These were pre-change live lab results and are not comparable with the current generated implementation.

### Current local SSR/browser validation

- Full static-output validation: 1,968 routes checked; 1,968 passed; 0 failures; 0 warnings.
- Existing browser-validation record: 7 Playwright tests passed on 2026-08-27; 0 hydration mismatches, 0 root-replacement warnings, 0 SSR/hydration page errors, and route CLS assertions passed at `<= 0.1`.
- Day-0 browser rerun: not completed. The local prerender test server failed before tests ran with `TypeError: relative is not a function` at `scripts/serve-prerendered.js:20` under Node `24.11.1`.
- Production-like Preview Lighthouse baseline: **pending**. Local measurements must not be presented as production or field performance.

## 14. Google Indexation

- Generated indexable routes (fresh local build): **1,968**.
- Deployed sitemap URLs observed: **1,972**.
- Google indexed pages: **Insufficient data**.
- Google non-indexed pages: **Insufficient data**.

Generated or sitemap URL totals do not represent Google-indexed pages.

## 15. Branded vs Non-Branded

- Branded organic baseline: **Insufficient GSC data**.
- Non-branded organic baseline: **Insufficient GSC data**.
- Commercial non-branded baseline: **Insufficient GSC data**.

SEMrush estimates, when available, must remain separate from this GSC measure.

## 16. Ranking Quick Wins

GSC positions 4–20: **pending — insufficient GSC data**.

No verified Semrush external quick-win snapshot was available, so none is included.

## 17. Known Day-0 Problems

- **P1 — Build/deployment catalogue alignment:** the fresh API-backed build has 1,968 URLs while the live sitemap has 1,972. Rebuild and deploy from one verified production API snapshot before treating route count changes as SEO performance changes.
- **P1 — Search Console history:** no reliable performance, indexation or sitemap-processing baseline exists yet because GSC was connected on 2026-08-27. This is a data-collection limitation, not a Phase 1 blocker.
- **P2 — Current browser-test execution:** `npm run test:browser` cannot start under the current Node 24.11.1 environment because the local `serve-prerendered.js` helper calls a non-function `relative`. Static validation and live representative checks pass, but hydration evidence should be rerun after this test helper is repaired.
- **P2 — Performance validation:** a production-like Vercel Preview Lighthouse baseline is pending. Historical pre-change Lighthouse identifies mobile home and brand TBT as areas to watch, but does not measure the current implementation.
- **P3 — Analytics verification:** Vercel Analytics/custom event ingestion is not confirmed; GA4 and GTM are absent from the repository.

No P0 issue was observed in the fresh static-output validation or sampled live HTTP checks.

## 18. Measurement Checkpoints

| Checkpoint | Date | Data to collect | Status |
| --- | --- | --- | --- |
| Day 0 | 2026-08-28 | Repository/build routes, sitemap/robots, technical implementation, analytics implementation, available performance evidence | Captured in this document |
| Day 7 | 2026-09-04 | GSC clicks, impressions, CTR, average position, indexed/non-indexed pages, top queries/pages, branded/non-branded, commercial impressions, positions 4–20, WhatsApp/quote conversions, organic sessions if available, sitemap/indexation issues | Pending |
| Day 14 | 2026-09-11 | Same Day-7 measurement set | Pending |
| Day 28 | 2026-09-25 | Same Day-7 measurement set and comparison with Day 0 where data is sufficient | Pending |

Do not enter zeroes for unavailable Search Console, analytics or conversion measurements; use **Insufficient data** or **unavailable** until the source reports a value.

## 19. Phase 1 Completion Status

**PHASE 1: COMPLETE**

All available Day-0 evidence has been captured, technical and live snapshots are separated, unavailable historical GSC/SEMrush/analytics data is explicitly documented, and future measurement checkpoints are fixed. No commercial pages, keyword research, blog content, deployment or production functionality changes were made in this phase.
