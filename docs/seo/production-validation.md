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

Local browser-suite CLS values were Home 0.002106, Category 0.002116, Brand 0.017030, Havells product 0.001290 and Finolex product 0.001290. Production Lighthouse lab CLS was 0 for all five sampled routes; all are within the 0.1 release budget.

| Route | Performance | SEO | LCP | CLS | TBT | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 82 | 100 | 3.49 s | 0 | 0 ms | 4.64 s |
| Category | 83 | 100 | 3.48 s | 0 | 0 ms | 4.60 s |
| Brand | 84 | 100 | 3.49 s | 0 | 0 ms | 3.24 s |
| Product | 85 | 100 | 3.48 s | 0 | 0 ms | 3.18 s |
| Finolex product | 80 | 100 | 3.74 s | 0 | 0 ms | 4.17 s |

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

---

# Prompt 3 — Production release + live validation

Validation date: 2026-09-01 (Asia/Calcutta).

## Deployment identity

- Deployed commit: `fdb98a7` (committed as `docs(seo): Update commercial implementation documentation and SEO strategy`, though it carries ~1,000 lines of hub/route/generator code — the prefix under-describes it). It reached `origin/main` as an ancestor of merge commit `f98387f`, pushed by the repository owner together with an unrelated cinematic video-hero feature (`dbb4fcf`, `fac70db`). No separate Prompt 3 push was needed — the code was already on `origin/main` and already deployed by the time this validation started; history was left untouched.
- `main` == `origin/main` == `f98387f` at the start of validation; the only new commit added here is this document update (`d866c0d`, docs-only).
- Deployment provider: Vercel production (git push to `main`). No Preview URL used. Vercel build logs were not accessible from this environment (`vercel`/`gh` CLI absent); deployment success was confirmed from live behaviour instead — all four new hubs serve pre-rendered SSR HTML with production canonical, the sitemap regenerated to the current catalogue, and no fallback shell was observed.
- Catalogue source: production API `https://new-delhi-electricals.onrender.com`. Fallback: not used.
- Build inventory at validation: 1,986 API products; `npm run test:seo` verified **1,972 / 1,972** generated routes (0 failed, 0 warnings); `npx tsc --noEmit` exit 0. The route total moved 1,940 → 1,972 because the live catalogue grew between the 2026-08-31 build recorded in `commercial-pages-implemented.md` and this deploy; the orphan-count and duplicate-title gates in `npm test` still pass, so the growth added product routes without breaking internal-link coverage.

## New hub HTTP + SSR

| Hub | HTTP | robots | Canonical | Raw HTML | gzip | H1 | JSON-LD | Products linked |
|---|---:|---|---|---:|---:|---:|---|---:|
| `/brand/polycab/wires-cables` | 200 | index, follow | self, absolute | 37.7 KB | 7.7 KB | 1 | BreadcrumbList + ItemList(8) | 8 |
| `/brand/finolex/wires-cables` | 200 | index, follow | self, absolute | 49.0 KB | 8.3 KB | 1 | BreadcrumbList + ItemList(16) | 16 |
| `/brand/anchor/switches-sockets` | 200 | index, follow | self, absolute | 236 KB | 20.9 KB | 1 | BreadcrumbList + ItemList(162) | 162 |
| `/brand/havells/switches-sockets` | 200 | index, follow | self, absolute | 303 KB | 27.0 KB | 1 | BreadcrumbList + ItemList(212) | 212 |

All four: unique title, unique description, exactly one H1, no `.seo-static-shell`, no client-only empty shell, parent brand link + parent category link + WhatsApp CTA + `/cart` link present in raw SSR. `ItemList.numberOfItems` equals the visible listing count on every hub.

## Rejected / deferred URLs

| URL | Result |
|---|---|
| `/brand/havells/wires-cables` | 404, `noindex, nofollow`, "Page Not Found" |
| `/brand/havells/circuit-protection` | 404, `noindex, nofollow` |
| `/brand/havells/water-heaters` | 404, `noindex, nofollow` |
| `/category/wires-cables/house-wires` | 404, `noindex, nofollow` |
| `/gurgaon` | 404, `noindex, nofollow` |
| `/noida` | 404, `noindex, nofollow` |

None resolve as an indexable thin page; none appear in the sitemap.

## Hydration (production browser, no request interception)

Playwright/Chromium against the live site, catalogue API not mocked. All four hubs:

- server H1 == hydrated H1; canonical persists (count 1); schema types persist (BreadcrumbList + ItemList).
- Hydration-mismatch console messages: **0**. Root replacements: **0**. Uncaught page errors: **0**.
- CLS during load: **0** on all four. DOM nodes after hydration: polycab 291, finolex 341, anchor 1,122, havells 1,426.
- Product inventory persists through hydration (SSR links retained; Havells adds 11 client-side).

## Hub → product live navigation

Real production API, no interception. For each hub: load → click first product → product route loads with correct H1 and canonical → back restores hub → forward restores product → add to cart succeeds → return to hub. Result:

| Hub | Product opened | Back/Forward | Add to cart | Page errors |
|---|---|---|---|---:|
| Polycab | Polycab FRLSH 0.75 sqmm 300m House Wire | ok | ok | 0 |
| Finolex | Finolex FR 0.75 sqmm 300m House Wire | ok | ok | 0 |
| Anchor | 10A DP 'C' Mini MCB | ok | ok | 0 |
| Havells | Bell Push 10A 1M - Grey | ok | ok | 0 |

## API / CORS

- Catalogue API now returns `access-control-allow-origin: https://www.newdelhielectricals.com` for production-origin requests. The CORS restriction that blocked local end-to-end validation is resolved in production.
- No CORS failures, no failed requests, no request loops, no full-catalogue client reload storm. Hub first load ≈ 3 catalogue calls; a full hub→product→back→forward→cart→hub flow = 17–25 calls total.
- Pre-existing, not introduced by Prompt 3: every product page fires one always-404 probe to `/api/products/brand/{brand}/{slug}` (×2), then succeeds via `/api/products/slug/{slug}`. Introduced in `d615f37`. Page render and cart are unaffected. Logged P2.

## Production Lighthouse (mobile, throttled)

| URL | Perf | SEO | LCP | CLS | TBT | SI |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 69 | 100 | 4.5 s | 0 | 170 ms | 6.0 s |
| `/category/wires-cables` | 31–34 | 100 | ~29 s | 0 | 3,400 ms | 6.5 s |
| `/category/circuit-protection` | 55 | 100 | 4.9 s | 0 | 850 ms | 4.2 s |
| `/brand/finolex` | 61 | 100 | 4.6 s | 0 | 560 ms | 4.7 s |
| `/brand/polycab/wires-cables` | 69 | 100 | 3.9 s | 0 | 390 ms | 3.9 s |
| `/brand/finolex/wires-cables` | 75 | 100 | 2.9 s | 0 | 590 ms | 2.9 s |
| `/brand/anchor/switches-sockets` | 72 | 100 | 4.6 s | 0 | 0 ms | 5.0 s |
| product (Finolex wire) | 73 | 100 | 4.5 s | 0 | 10 ms | 3.1 s |

Prompt 1 production baseline: Perf 80–85, LCP 3.48–3.74 s, CLS 0, TBT 0 ms.

## Performance decision

- **CLS ≤ 0.1 everywhere — measured 0** on every page, including the 162- and 212-link switch hubs, in both Lighthouse and Playwright. One first-run Lighthouse blip of 0.12 on the product page did not reproduce across two clean re-runs (0, 0). No CLS regression.
- **The four new hubs are the healthiest pages measured** (Perf 69–75, LCP 2.9–4.6 s, TBT 0–590 ms). The 162-link Anchor hub scored Perf 72 / TBT 0 ms. Prompt 3's internal-link expansion did **not** materially degrade LCP, TBT, HTML size or DOM size.
- **`/category/wires-cables` is genuinely slow** (Perf ~32, LCP ~29 s, TBT ~3.4 s), but the Lighthouse trace attributes it to **~5 MB of unoptimised Cloudinary images** — two single images of 3.2 MB and 1.7 MB served with no `f_auto/q_auto/w_` transform — plus heavy `react-vendor` hydration (~3 s scripting) and `animation-vendor` (GSAP, ~1.4 s). `CategoryPage.tsx` was not touched by Prompt 3; this is pre-existing image-pipeline debt made more visible.
- **Homepage 69 vs baseline 80–85**: same deploy shipped a cinematic 2K scroll-driven video hero + GSAP (`dbb4fcf`, `fac70db`, repository owner's work). `animation-vendor` bootup is the homepage regression driver, not Prompt 3.
- Conclusion: **no material performance regression attributable to Prompt 3.** No change to the crawlable hub architecture is warranted by the evidence. Follow-up levers (P1) are the image pipeline and the animation bundle, both outside the Prompt 3 change set.

## HTML / DOM / internal-link scale

| Page | Raw HTML | DOM nodes | Anchors | Product links |
|---|---:|---:|---:|---:|
| `/category/plates` | 132 KB | 907 | 39 | 20 |
| `/category/wires-cables` | 134 KB | 919 | 39 | 20 (26 unique incl. nav) |
| `/brand/polycab/wires-cables` | 37.7 KB | 291 | 29 | 8 |
| `/brand/anchor/switches-sockets` | 236 KB | 1,122 | 191 | 162 |

The "166 → 1,918 linked products" expansion is distributed by relevance, not dumped. Every hub carries only its own brand × category slice (8 / 16 / 162 / 212), 100 % on-brand — 162 `/anchor/` links on the Anchor hub, 212 `/havells/` links on the Havells hub, zero cross-brand. Category pages carry ~20 curated product links, not thousands. No page carries the full catalogue. Orphan products: 0 (enforced by `npm test`).

## Analytics

Production hub WhatsApp CTA, per hub: exactly `whatsapp_click` ×1 then `whatsapp_enquiry_start` ×1. No duplicate firing. Payload = `{ page_type: "commercial-hub", page_path, cta_location: "hub_hero_<brand>_<category>" }`. No name, phone, email, message text or search query in any payload. Brand/category context present via `page_path` and `cta_location`. The fuller cart-quotation chain (`quote_enquiry_start` → `whatsapp_click` → `whatsapp_enquiry_start` → `quote_enquiry_handoff`) remains covered by the local browser suite.

## Mobile CRO (390×844)

All four hubs: no horizontal overflow (scrollWidth == 390), H1 readable, WhatsApp CTA visible and usable, breadcrumbs visible, cart works, CLS 0, no page errors.

## Cannibalization / Finolex quick win

- Homepage: broad commercial Delhi intent ("Leading supplier of electrical components, switches, wires, MCBs… in New Delhi"). About: company-information intent. Brands: brand-navigation intent. All three `index, follow`, distinct canonicals — not canonicalized or noindexed.
- `/brand/finolex` (parent): title "Finolex – 10 Products", H1 "Finolex", broad authorised-dealer catalogue intent. `/brand/finolex/wires-cables` (child): title "Finolex Wires & Cables Dealer in Delhi | Prices & Quote", H1 "Finolex Wires & Cables in Delhi NCR", grade/size/quote intent. Title, H1, description and primary anchors all distinct — no duplication. (Parent's generic "– 10 Products" title is a pre-existing P2 quick-win, unrelated to Prompt 3.)

## Schema

New hubs: `BreadcrumbList` (4-level Home → Brands → Brand → Hub) on all four; `ItemList` on all four with `numberOfItems` equal to the visible listing (8 / 16 / 162 / 212). Product page re-checked: `Product` + `BreadcrumbList`, no `Offer`, `availability`, `InStock`, `aggregateRating`, `review`, `priceValidUntil` or `price`. No regression from Prompt 1.

## Sitemap

`sitemap.xml`: single `urlset`, **1,972** `<loc>` URLs, 1,972 unique (0 duplicates), 0 query strings, 0 admin/cart/checkout/login/search utility routes. All four new hubs present (one entry each). All six rejected/deferred URLs absent.

## Remaining issues — Prompt 3

### P0

None.

### P1

- `/category/wires-cables` (and, to a lesser degree, other catalogue pages): serve Cloudinary images through a transform (`f_auto,q_auto` + width), and prioritise the LCP image. Two 3 MB / 1.7 MB raw JPEGs dominate a 5.4 MB mobile page.
- Split or defer `animation-vendor` (GSAP) so the cinematic hero's cost is not paid on category/brand/hub routes.
- Pre-existing: repair full TypeScript app errors and add a typecheck release gate.

### P2

- Product data hook probes an always-404 `/api/products/brand/{brand}/{slug}` before falling back to `/api/products/slug/{slug}` — remove the dead probe.
- Consider sectioning or lazy-rendering the 200+-item Anchor/Havells switch hubs if field CWV data later shows LCP/TBT pressure; keep all anchors crawlable.
- `/brand/finolex` parent title is a generic "<brand> – N Products" template.

---

# Production Validation — Prompt 3.5 (Performance Cleanup)

Validation date: 2026-09-01 (Asia/Calcutta). This section records the
performance cleanup deployed on top of Prompt 3. Full cause analysis and
implementation detail: [performance-optimization.md](performance-optimization.md).

## Deployment identity

- Baseline (Prompt 3): `6a15881`.
- Delivered: `c4ba08a` (Cloudinary delivery + GSAP unbundling + hero video),
  `a374bf3` (SSR/client asset-path alignment).
- Pushed to `main`; Vercel Production (not Preview). Deployment confirmed by
  matching the live client asset hash `index-DXQ7ASFL.js` and the live
  `/assets/jpg/hero-premium-CqHmq5bG.jpg` path against the local build.
- Catalogue source: production API, `https://new-delhi-electricals.onrender.com`.

## Local release gate

| Gate | Result |
| --- | --- |
| `npm run build` | passed; React SSR SEO generation used the production API |
| `npm run test:seo` | passed — **1,972 routes checked, 1,972 passed, 0 failed, 0 warnings** |
| `npm run test:browser` | 14/15 — the single failure is pre-existing (see below) |
| `npx tsc --noEmit -p tsconfig.app.json` | 29 errors, **identical to baseline**, 0 new |
| `git diff --check` | clean |

The `hub-anchor-switches` browser-test failure was reproduced on unmodified
`6a15881` before any change was made. Two Anchor SKUs differ only by a `-b`
suffix and sort non-deterministically between the build-time prerender snapshot
and the live API. It is a catalogue data tie, not a regression.

## Mobile Lighthouse — production

Before = live production at `6a15881`, single run. After = live production at
`a374bf3`, **median of 3** (an initial single After run was discarded as machine
noise; run-to-run TBT spread on this host reached 1,500 ms). The Before figures
match the independently reported Prompt 3 measurements closely, so they are used
as recorded. SEO scored **100 on every route, before and after**.

| Route | Perf | LCP | CLS | TBT | Speed Index | Bytes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 70 -> 70 | 4.62 -> 4.69 s | 0 -> 0 | 88 -> 93 ms | 6.04 -> 6.00 s | 15.19 -> 11.93 MB |
| `/category/wires-cables` | **44 -> 69** | **29.34 -> 4.54 s** | 0 -> 0 | **795 -> 225 ms** | 5.51 -> 5.16 s | **5.27 -> 0.42 MB** |
| `/category/circuit-protection` | **58 -> 66** | 5.01 -> 4.54 s | 0 -> 0 | **481 -> 315 ms** | 5.38 -> 5.22 s | 0.55 -> 0.43 MB |
| `/brand/finolex` | 72 -> 72 | 4.55 -> 4.53 s | 0 -> 0 | 24 -> 0 ms | 5.25 -> 5.19 s | 0.45 -> 0.57 MB |
| `/brand/polycab/wires-cables` | 75 -> 75 | 4.39 -> 4.39 s | 0 -> 0 | 0 -> 0 ms | 4.09 -> 3.94 s | 0.44 -> 0.41 MB |
| `/brand/anchor/switches-sockets` | 74 -> 74 | 4.34 -> 4.39 s | 0.071 -> 0 | 70 -> 0 ms | 4.19 -> 4.93 s | 0.47 -> 0.44 MB |
| `/finolex/finolex-fr-1-5-sqmm-90m-house-wire` | 73 -> 73 | 4.54 -> 4.39 s | 0.002 -> 0 | 1 -> 0 ms | 4.37 -> 5.27 s | 0.44 -> 0.41 MB |

The `/category/wires-cables` 29 s LCP is resolved. Routes that were already
healthy are unchanged or marginally better; none regressed. `/brand/finolex`
byte weight rose because four hero images that were 404ing now load.

## Image delivery — live

- `/category/wires-cables` image transfer **4,939.4 KB -> 3.6 KB**; largest image
  **3,210.8 KB -> 2.4 KB**.
- All 243 unique Cloudinary catalogue images, expanded across every width the
  helper can emit: **1,944 derivative URLs, 0 non-200**.
- Live DOM check on `/category/wires-cables`, `/category/circuit-protection`,
  `/category/plates`, a product page and `/`: **0 broken images, 0 image 4xx/5xx**.
- Transforms confirmed live: category cards `f_auto,q_auto,w_480,c_limit`,
  product gallery `w_960` with `fetchpriority="high"`, similar products `w_640`
  with `loading="lazy"`.
- Non-Cloudinary catalogue hosts (`smartshop.lk-ea.com`, `jayceeonline.com`,
  `cdn.moglix.com`, `m.media-amazon.com`, `havells.com`) and backend-relative
  paths are left untouched by the helper, as are signed and private URLs.
- The five previously 404ing `/assets/*.jpg` hero images now resolve.

## Animation bundle — live

`animation-vendor` 186.48 -> 116.20 KB (66.13 -> 38.48 KB gzip). GSAP core is now
a 69.94 KB async-only chunk. Eager script tags on live production: 8 on `/` (the
only route that uses GSAP), 6 on `/category/wires-cables`,
`/category/circuit-protection`, `/brand/finolex` and
`/brand/polycab/wires-cables` — none of which now load GSAP or ScrollTrigger.

## SSR, hydration and navigation — live

- HTTP 200 on `/`, `/category/wires-cables`, `/category/circuit-protection`,
  `/brand/finolex`, all four commercial hubs, a product page, `/sitemap.xml`,
  `/robots.txt`.
- Browser check on `/category/wires-cables`: **0 hydration warnings, 0 root
  replacements, 0 page errors**.
- Product navigation works: a grid anchor on `/category/wires-cables` navigates
  to `/finolex/finolex-fr-0-75-sqmm-300m-house-wire`, which renders its own H1,
  exactly 1 canonical and `Product` + `BreadcrumbList` schema.
- Prerendered `/category/wires-cables` still ships 20 SSR product cards with
  crawlable `<a href>` anchors and no JavaScript required.

## Cinematic homepage — unchanged experience

Verified across three profiles on the built output: desktop keeps the 1440p
all-intra scrub (ScrollTrigger pinned, `preload` re-armed to `auto`, preloader
dismissed); mobile autoplays the 720p loop; reduced motion paints the same
single still frame and loads no GSAP at all. 0 page errors on all three. Mobile
and reduced motion now issue exactly one `.mp4` request instead of fetching and
discarding the 1440p master.

## Unaffected

- **CORS**: production API returns
  `access-control-allow-origin: https://www.newdelhielectricals.com`,
  `access-control-allow-credentials: true`, `Vary: Origin` — unchanged.
- **Sitemap**: 1,972 routes, unchanged; no catalogue change was made.
- **Schema**: unchanged — `Product` + `BreadcrumbList` on products,
  `BreadcrumbList` + `ItemList` on hubs.
- **Analytics**: no tracking code touched; conversion and WhatsApp-handoff
  browser tests pass.

## Remaining issues — Prompt 3.5

### P0

None.

### P1

- **Render-blocking resources are now the entire LCP cost.** LCP phase breakdown
  shows load delay 0 ms and load time 0 ms — images are off the critical path —
  with 3,750-3,926 ms of pure render delay. The Google Fonts stylesheet alone
  accounts for 844-883 ms as a cross-origin blocking request; `index-*.css` adds
  150-156 ms with ~17 KB unused. Self-hosting or preconnecting the font and
  splitting critical CSS is the highest-value next action.
- **`framer-motion` is statically imported by ~45 components**, so
  `animation-vendor` (116 KB / 38 KB gz) stays eager on every route. Route-scoping
  it is a real refactor, deliberately out of scope here.
- Pre-existing: repair the 29 TypeScript app errors and add a typecheck release
  gate.

### P2

- Homepage mobile video is still 11.48 MB and is the homepage LCP element.
  Re-encoding, a poster frame, or a save-data gate would each help but alter the
  owner's visual design; documented rather than changed. `public/` also ships two
  unreferenced encodes (~28 MB of deploy weight, no user transfer).
- Pre-existing `hub-anchor-switches` browser-test failure caused by two Anchor
  SKUs that differ only by a `-b` suffix.
- Carried over from Prompt 3: dead `/api/products/brand/{brand}/{slug}` probe;
  generic `/brand/finolex` parent title.

### Closed by this change set

- ~~`/category/wires-cables` Cloudinary images unoptimised~~ — resolved.
- ~~`animation-vendor` (GSAP) paid on category/brand/hub routes~~ — resolved.

---

# Production Validation — Prompt 3.6 (Font / Render-Blocking)

Validation date: 2026-09-01 (Asia/Calcutta). Full detail:
[font-optimization.md](font-optimization.md).

## Deployment identity

- Baseline: `bd2e0b2` (end of Prompt 3.5).
- Delivered: `34c6d1a` (self-hosted Inter), `5bb3a04` + `e1793e7` (immutable
  asset caching; `5bb3a04` edited the repo-root `vercel.json`, but the Vercel
  Root Directory is `frontend`, so `e1793e7` applied it to the file actually
  read).
- Pushed to `main`; Vercel Production, not Preview. Confirmed live by the
  deployed CSS hash `index-DudNHuSK.css` and by the immutable header appearing
  on a fresh `/assets` path.

## Local release gate

| Gate | Result |
| --- | --- |
| `npm run build` | passed |
| `npm run test:seo` | **1,972 routes, 1,972 passed, 0 failed, 0 warnings** |
| `npm run test:browser` | 14/15 — the one failure is the known pre-existing `hub-anchor-switches` SKU sort tie |
| `npx tsc --noEmit -p tsconfig.app.json` | 29 errors, **identical to baseline, 0 new** |
| `git diff --check` | clean |

## Font delivery — live

- `fonts.googleapis.com` and `fonts.gstatic.com` appear **0 times** in any built
  artifact: CSS, `index.html`, and all 1,972 prerendered routes.
- Both self-hosted woff2 files return 200 on every route tested; **0 font 404s**.
- Verified across 7 routes x desktop + mobile (14 combinations): Inter applied
  (never stuck on fallback), ₹ renders, no missing glyphs, no FOIT.
- Typography identical to the Google-hosted baseline, measured numerically at
  every weight 200-700 (e.g. `/category/wires-cables`: 681.55 / 681.55 / 695.38
  / 702.94 / 710.34 / 717.83 both before and after).
- `@font-face` declarations: 42 -> 2.

## Render-blocking — live

`fonts.googleapis.com` is gone from the render-blocking audit. Estimated
savings fell from 1,680 ms to 660-692 ms on `/category/wires-cables` and from
1,450 ms to 685-710 ms on `/brand/polycab/wires-cables`. LCP render delay
3,750 ms -> 2,523 ms (Polycab hub) and 3,926 ms -> 3,421 ms (wires-cables);
FCP on wires-cables 3.96 s -> 2.89 s. LCP improved on every route measured, by
0.32-1.09 s.

TBT and Performance score were unreliable this session because of host
contention (spreads such as 4867/1253/8591 ms on one route) and should not be
read as regressions; see the caveat in font-optimization.md.

## Caching — live

All hashed `/assets` files (js, css, woff2, jpg) now return
`public, max-age=31536000, immutable`. HTML, `sitemap.xml` and `robots.txt`
correctly remain `public, max-age=0, must-revalidate`.

## SSR, hydration, schema, analytics — live

- HTTP 200 on `/`, both category routes, `/brand/finolex`, all four commercial
  hubs, a product page, `/sitemap.xml`, `/robots.txt`.
- Product navigation from a category grid works; destination renders its own H1,
  exactly 1 canonical, and `Product` + `BreadcrumbList` schema.
- **0 hydration warnings, 0 root replacements, 0 page errors.**
- Sitemap unchanged at **1,972** `<loc>` entries.
- Analytics untouched; `/_vercel/insights/script.js` returns 200.

## Remaining issues — Prompt 3.6

### P0

None.

### P1

- **Font-swap CLS on commercial hubs**: `/brand/polycab/wires-cables` 0.158,
  `/brand/anchor/switches-sockets` 0.071. Blocking all woff2 drives both to 0,
  confirming `font-display: swap` reflow as the cause. Pre-existing, not
  introduced here — the Anchor hub measured 0.071 in the Prompt 3.5 *before*
  run on Google Fonts — but faster font arrival makes it land in the
  measurement window more consistently. Remedy is a metric-matched fallback
  face; the required `size-adjust` values are already measured (Arial 105.26 %,
  Segoe UI 107.23 %, Roboto 114.42 %; Inter ascent 97, descent 24 at 100 px).
- **Main CSS is now the only render blocker** (660-710 ms, 20.63 KB gzip,
  ~18 KB unused). Needs route-level CSS splitting or critical CSS.
- `framer-motion` static imports across ~45 components (deferred by Phase 7).
- 29 pre-existing TypeScript errors; no typecheck gate.

### P2

- Homepage mobile video 11.48 MB and is the homepage LCP element.
- Pre-existing `hub-anchor-switches` browser-test SKU sort tie.
- `src/App.css` is dead Vite scaffold contributing 0 bytes; deletable.

### Closed by this change set

- ~~Google Fonts stylesheet blocking render for 844-883 ms~~ — resolved.
- ~~Hashed build assets served with `max-age=0, must-revalidate`~~ — resolved.

---

# Prompt 4 — Production release + live validation

**Deployed 2026-09-01** to Vercel Production via `main`. No preview deployment was created.

| | |
|---|---|
| Commits | `0a5925e` — /guides content layer, Anchor ordering fix, editorial closure, trust claims<br>`7e16f68` — browser-validation baselines |
| Deployed HEAD | `7e16f688382e8b403966518585912c7ed0e208b7` |
| Pushed | `18831dc..7e16f68  main -> main` |
| Working tree at release | clean; `dist/` untracked as per policy |
| Route total | 1,972 → **1,978** (1,950 products, 6 categories, 5 brands, 4 hubs, 5 guides + index) |

## Local release gate

| Gate | Result |
|---|---|
| `npm ci` | clean |
| `npm run build` | pass — 1,978 indexable routes from the **production** catalogue API (no fallback) |
| `npm run test:seo` | **1,978/1,978 pass, 0 failures, 0 warnings** |
| `npm run test:browser` | **32/32 pass** — was 31 pass / 1 fail |
| `npx tsc --noEmit` | **0 errors** (the Prompt 3.5 note of "29 pre-existing TypeScript errors" is stale) |
| `git diff --check` | pass — CRLF advisories only |

## Production HTTP

| URL | HTTP | Robots | Canonical |
|---|---|---|---|
| `/guides` | 200 | index, follow | self |
| `/guides/best-wire-for-house-wiring` | 200 | index, follow | self |
| `/guides/genuine-finolex-wire` | 200 | index, follow | self |
| `/guides/mcb-vs-mccb` | 200 | index, follow | self |
| `/guides/how-to-choose-mcb-for-home` | 200 | index, follow | self |
| `/guides/rccb-explained` | 200 | index, follow | self |
| `/guides/not-a-real-guide` | **404** | **noindex, nofollow** | `/404` |
| `/guides/best-wire-for-house-wiring/` | 308 → non-slash canonical | — | — |

## Production raw SSR (JavaScript disabled)

Every guide is a complete crawlable document before any script runs.

| URL | H1 | H2 | Words | Schema | Commercial links | Placeholders | FAQPage |
|---|---|---|---|---|---|---|---|
| `/guides` | 1 | 3 | 395 | BreadcrumbList + ItemList | 3 | none | none |
| `/guides/best-wire-for-house-wiring` | 1 | 11 | 2,762 | Article + BreadcrumbList | 3 | none | none |
| `/guides/genuine-finolex-wire` | 1 | 11 | 2,394 | Article + BreadcrumbList | 2 | none | none |
| `/guides/mcb-vs-mccb` | 1 | 11 | 2,040 | Article + BreadcrumbList | 1 | none | none |
| `/guides/how-to-choose-mcb-for-home` | 1 | 11 | 2,421 | Article + BreadcrumbList | 2 | none | none |
| `/guides/rccb-explained` | 1 | 11 | 2,396 | Article + BreadcrumbList | 1 | none | none |

`Article.author` is `Organization` — no human author is fabricated. `datePublished` and
`dateModified` are 2026-09-01, the real authoring date. No `FAQPage` anywhere.

The resolved editorial copy was confirmed present in the live HTML: the Finolex "True Product
Checker" description and the "scan only the external QR code" instruction, the RCCB no-type
callout and its IS 12640-1 citation, and the reworded footer trust line. The strings
`27 Years` / `27 years` / `3000+` return **zero matches** on the live homepage and `/about`.

## Production hydration

| Route | SSR products | Hydrated | Same set | Same **order** | Mismatches | Root replacements | Page errors | CLS |
|---|---|---|---|---|---|---|---|---|
| `/guides` | 0 | 0 | yes | identical | 0 | 0 | 0 | 0.0023 |
| `/guides/best-wire-for-house-wiring` | 6 | 6 | yes | identical | 0 | 0 | 0 | 0.0010 |
| `/guides/rccb-explained` | 7 | 7 | yes | identical | 0 | 0 | 0 | 0.0077 |
| `/guides/genuine-finolex-wire` | 6 | 6 | yes | identical | 0 | 0 | 0 | 0.0083 |
| **`/brand/anchor/switches-sockets`** | **162** | **162** | yes | **identical** | 0 | 0 | 0 | 0.0030 |

The Anchor hub is the case that used to reorder. All 162 records now hydrate in byte-identical
order in production. One title and one canonical survive hydration on every route; no
`.seo-static-shell` and no root replacement anywhere.

## Production sitemap

`/sitemap.xml` — HTTP 200, `application/xml`, **1,978 URLs, 0 duplicates**. `/guides` and each
of the five guides appear **exactly once**. Zero draft/placeholder-looking URLs. `robots.txt`
points at it.

## Guide performance — production

Network profile of a guide route, measured live: **12 requests, ~130 KB**, of which
**0 GSAP requests** (`window.gsap` absent; the `animation-vendor` chunk is framer-motion only,
0 occurrences of `gsap`/`ScrollTrigger`), **0 video/media requests**, **0 images**, and
**0 catalogue data requests**. The only two API calls are fire-and-forget
`POST /api/tracking/event` analytics beacons — there is no catalogue fetch, no request loop and
no fallback-data request.

Lighthouse mobile, one clean same-session comparison run (guides vs pre-existing pages):

| Page | Perf | **SEO** | TBT | LCP | **CLS** |
|---|---|---|---|---|---|
| `/guides/rccb-explained` (Prompt 4) | 87 | **100** | 130 ms | 3.1 s | **0.004** |
| `/guides/best-wire-for-house-wiring` (Prompt 4) | 80 | **100** | 50 ms | 3.9 s | **0** |
| `/brand/finolex/wires-cables` (Prompt 3) | 82 | 100 | 200 ms | 3.1 s | 0.092 |
| `/category/circuit-protection` (Prompt 1–3) | 34 | 100 | 6,580 ms | 6.2 s | 0 |

**SEO 100 on both guides. CLS ≤ 0.1 everywhere, and the guides are the best CLS on the site**
(0–0.004 against the Prompt 3 hub's 0.092, which sits close to the threshold). No performance
regression is attributable to Prompt 4 — the guides are the lightest and fastest page type here.

> Reading note: earlier back-to-back Lighthouse runs reported TBT of 1,290–2,830 ms on
> `/guides/rccb-explained`. That was local CPU contention from consecutive runs, not the page:
> the same URL measures 130 ms TBT in the clean run above. Do not treat contended
> single-run Lighthouse numbers on this machine as page characteristics.

## Guide analytics — production

Live CTA click on `/guides/genuine-finolex-wire`:

- events dispatched: `whatsapp_click`, then `whatsapp_enquiry_start`
- **`page_type: "guide"`** — not `product`. `/guides` classifies as `guides-index`.
- **each event fires exactly once; no duplicates**
- properties are `page_type`, `page_path`, `cta_location` (`guide_genuine-finolex-wire`).
  **No PII** — no name, phone, email or free-text enquiry content is attached, and the
  prefilled WhatsApp text is a product-category request only.
- no new SEO event names were invented; this is the existing taxonomy.

This proves application dispatch, as before. Vercel account-level ingestion remains unverified.

## Remaining issues after Prompt 4

### P0
None. No release-blocking engineering item remains.

### P1
- `/category/circuit-protection` mobile Perf 34, TBT 6.58 s, LCP 6.2 s. **Pre-existing**
  (Prompt 1–3 territory), not a Prompt 4 regression, and deliberately not reopened here.
  It is now the slowest page on the site and the strongest performance candidate.
- `/brand/finolex/wires-cables` CLS 0.092 — passes, but close to the 0.1 threshold. The
  metric-matched font fallback already specified in the Prompt 3.5 notes would fix it.
- `src/components/Hero.tsx` and `src/components/home/HeroSection.tsx` still contain the old
  `27 Years of Trusted Service | 3000+ Happy Customers` wording. **Both are dead code** — no
  route imports either, so nothing is published from them. Delete or reword before either is
  ever revived.
- The Prompt 3.5 note claiming "29 pre-existing TypeScript errors" is stale; `tsc --noEmit`
  is clean. A typecheck gate in CI would keep it that way.

### Operational, not engineering
Manufacturer directory outreach, the Sulekha and Tata Nexarc listings, the GBP audit, the
Search Console connection and the Backlink Gap export are tracked in
`30-day-commercial-implementation-order.md` § "Off-page and measurement". None blocks code;
**GSC is the real gate on all Days 28–30 measurement work.**
