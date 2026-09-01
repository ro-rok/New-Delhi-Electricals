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

- Deployed commit: `fdb98a7` (`feat(seo): add commercial hubs and internal linking` — the message was re-worded locally from its original `docs(seo):` prefix; content unchanged). It reached `origin/main` as an ancestor of merge commit `f98387f`, pushed by the repository owner together with an unrelated cinematic video-hero feature (`dbb4fcf`, `fac70db`). No separate Prompt 3 push was needed — the code was already on `origin/main` and already deployed by the time this validation started.
- `main` == `origin/main` == `f98387f` at validation time; working tree clean.
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
