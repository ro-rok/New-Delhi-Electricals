# Commercial Pages Implemented — Prompt 3

Implementation date: 2026-08-31
Research basis: SEMrush India desktop, 2026-08-30 (Prompt 2). Metrics below are quoted from those files unchanged.
Catalogue basis: production API `https://new-delhi-electricals.onrender.com/api/products` at build time.

**Google Search Console: GSC DATA PENDING.** No clicks, impressions, CTR or GSC positions appear anywhere in this document. Rankings quoted are SEMrush positions from 2026-08-30. No ranking improvement is claimed — nothing has been measured post-deployment.

## Build state after Prompt 3

| Metric | Prompt 1 baseline | After Prompt 3 |
|---|---:|---:|
| API products loaded | 1,986 | 1,986 |
| Indexable product pages | 1,918 | 1,918 |
| Excluded duplicate canonical products | 32 | 32 |
| Commercial hubs | 0 | 4 |
| Total indexable routes | 1,936 | 1,940 |
| Noindex utility routes | 4 | 4 |
| Products linked from a non-product page | 166 | 1,918 |
| Products with no internal link | 1,752 | 0 |
| Product documents with a duplicate title | 136 | 0 |

The internal-link and duplicate-title figures are emitted by the build itself
(`dist/seo-build-report.json` → `internalLinks`) and enforced by `npm test`.

## Production status (2026-09-01)

Deployed to Vercel production in commit `fdb98a7` (on `origin/main` as an ancestor of merge `f98387f`, pushed alongside an unrelated video-hero feature). Live-validated 2026-09-01 — full evidence in `production-validation.md` § "Prompt 3 — Production release + live validation".

- All four approved hubs return **HTTP 200**, indexable (`index, follow`), production canonical, unique title/description, one H1, real SSR product data, `BreadcrumbList` + accurate `ItemList`. Hydration on the live site: 0 mismatches, 0 root replacements, 0 page errors, CLS 0.
- Hub → product live navigation (click / back / forward / add-to-cart / return) works on the real production API. Production CORS now allows the `www` origin.
- Rejected URLs (`/brand/havells/wires-cables`, `/brand/havells/circuit-protection`, `/brand/havells/water-heaters`, `/category/wires-cables/house-wires`) and deferred `/gurgaon`, `/noida` all return 404 `noindex`; absent from the sitemap.
- Route total is now **1,972** (was 1,940 at the 2026-08-31 build) — the live catalogue grew; orphan and duplicate-title gates still pass.
- Internal links stay contextually scoped: each hub links only its own brand × category slice (8 / 16 / 162 / 212), 100 % on-brand; category pages ~20 curated links; no page carries the full catalogue; orphans 0.
- Production mobile Lighthouse: new hubs Perf 69–75, LCP 2.9–4.6 s, CLS 0, TBT 0–590 ms — the healthiest pages measured. No performance regression is attributable to Prompt 3. `/category/wires-cables` is slow (Perf ~32) due to pre-existing ~5 MB unoptimised Cloudinary images and the video-hero animation bundle, not the hub/index work.
- Hub WhatsApp analytics: `whatsapp_click` ×1 + `whatsapp_enquiry_start` ×1, no duplicates, no PII.

---

## Phase 2 — Live inventory gate

Counts are active, canonical, brand-and-category-resolved catalogue records at build time.

| Proposed page | Products | Families | Useful attributes | Price coverage | Image coverage | Inventory depth | Unique-value potential | Decision |
|---|---:|---|---|---:|---:|---|---|---|
| `/brand/polycab/wires-cables` | 8 | 1 (FR-LSH), 8 conductor sizes 0.75–16 sq mm | size_sqmm, length_m, wire_type, conductor_material, insulation_material, voltage_rating, core_count | 8/8 | 4/8 | Narrow but complete range | High — size/length/price-per-metre comparison | **APPROVED** |
| `/brand/finolex/wires-cables` | 16 | 2 (FR, FRLS), 10 sizes 0.75–35 sq mm, 4 coil lengths | same 7 keys | 16/16 | 0/16 | Complete two-grade range | High — grade split and 90 m short-coil option | **APPROVED** |
| `/brand/havells/wires-cables` | **0** | — | — | — | — | None | None | **REJECTED** |
| `/brand/anchor/switches-sockets` | 162 | Penta; 7 catalogue categories | 16 spec keys (mw, ampere, color, type_detail…) | 162/162 | 0/162 | Deep | High — module width, rating, finish, function | **APPROVED** |
| `/brand/havells/switches-sockets` | 201 | Signia (130), Fabio (93) before canonical exclusions | 21 spec keys incl. usb_type, smart, with_shutter | 201/201 | 0/201 | Deep | High — two ranges, smart/USB/shuttered modules | **APPROVED** |
| `/brand/havells/circuit-protection` | **0** | — | — | — | — | None | None | **REJECTED** |
| `/brand/havells/water-heaters` | **1** | — | capacity_liters, wattage | 1/1 | 1/1 | One SKU | None | **REJECTED** |
| `/category/wires-cables/house-wires` | 24 | Identical to the whole parent category | — | 24/24 | 4/24 | Duplicate of parent | None | **REJECTED** |
| `/electrical-shop-gurgaon` | n/a | — | — | — | — | n/a | No unique operational content found in repo | **REJECTED (deferred)** |
| `/electrical-shop-noida` | n/a | — | — | — | — | n/a | No unique operational content found in repo | **REJECTED (deferred)** |

### Inventory findings that contradict Prompt 2

Prompt 2 ranked three pages that the live catalogue cannot support. This is recorded here rather
than rewritten in the research files, so the original SEMrush reasoning stays intact:

- **Havells wires & cables (P0, score 89):** the catalogue holds **zero** Havells records in
  `Wires & Cables`. All 24 wire records are Polycab (8) and Finolex (16). Demand is real
  (`havells wire` 9,900/KD27) but there is no product to sell on the page.
- **Havells circuit protection (P1, score 87):** the catalogue holds **zero** Havells records in
  `Circuit Protection`. All 132 circuit-protection records are Lauritz Knudsen (Tripper range).
- **Havells water heaters (P1, score 82):** exactly **one** geyser record exists
  (`GHWACAPWH005`, Havells Carlo 5 Ltr).

An inverse mismatch also exists and was **not** acted on: Lauritz Knudsen circuit protection has
the deepest single-brand technical inventory in the catalogue (132 records, MCB/RCCB/RCBO/isolator/
changeover, 6–125 A, 1–4 pole, 30/100/300 mA), but Prompt 2 found no measured Lauritz Knudsen query
cluster. Prompt 2's deferral is preserved: no LK brand-hub was built. The inventory is instead used
to strengthen `/category/circuit-protection`.

---

## Existing pages improved

### 1. `/brand/finolex` — Phase 3/4 priority 1

| Field | Value |
|---|---|
| Type | Existing |
| Primary keyword | `finolex dealers in delhi` |
| Volume / KD | 110 / KD 19 (Organic Research) — Keyword Analytics reports KD 17; both values preserved |
| Secondary cluster | `finolex wire dealer in delhi` 110/KD12 |
| Opportunity score | 89/100 (Prompt 2 derived) |
| Intent | Local commercial / dealer |
| SEMrush source | `semrush-current-rankings.csv`, `commercial-page-map.md` |
| Current ranking | SEMrush position 29, 2026-08-30. Not re-measured. |
| Inventory evidence | 16 Finolex catalogue records, 100% priced |
| Title | Finolex Wires & Cables Dealer in Delhi \| New Delhi Electricals |
| H1 | Finolex Dealer in Delhi NCR |
| Links in | `/`, `/brands`, `/category/wires-cables`, `/brand/finolex/wires-cables`, all other brand pages |
| Links out | `/brand/finolex/wires-cables`, `/category/wires-cables`, 4 other brand pages, 16 product pages |
| CTA | WhatsApp enquiry, quotation list (`/cart`), contact |
| Schema | BreadcrumbList |
| Status | Implemented |
| Test result | Pass — `npm test`, hydration and CLS suites |

Broad brand-dealer intent is deliberately kept on the parent: it still states the authorised-dealer
relationship, the Delhi NCR service area, the categories carried and the discovery/quote paths, and
links **down** to the wires hub rather than being converted into a wire page.

### 2. `/` — Phase 5

| Field | Value |
|---|---|
| Primary keyword | `electrical shops in delhi` — 590 / KD 21 |
| Secondary cluster | `electrical company in delhi` 320/KD23 (SEMrush #46); `electrical dealers near me` 210/KD30; `electrical wholesalers near me` 4,400/KD32 |
| Opportunity score | 91/100 |
| Title | Electrical Shop in Delhi NCR — Switches, Wires & MCBs \| New Delhi Electricals |
| H1 | Electrical Shop in Delhi NCR for Homes, Trade and Projects |
| Links out | 6 categories, 5 brands, 4 commercial hubs, 12 balanced product cards |
| CTA | WhatsApp, quotation list, contact |
| Schema | LocalBusiness (unchanged from Prompt 1) |

Adds a three-part proposition block naming the authorised-dealer relationship, the five customer
segments (homeowners, electricians, contractors, builders/developers, architects/interior designers)
and the two conversion paths. No synonym pages were created.

### 3. `/about` and `/brands` — Phase 6 cannibalization fix

Both previously carried "Delhi" dealer/company phrasing that competed with the homepage for
`electrical company in delhi` (SEMrush: `/about` #63, `/brands` #78).

| Page | Before (title) | After (title) | Job now |
|---|---|---|---|
| `/about` | About New Delhi Electricals \| Electrical Dealer in Delhi | About New Delhi Electricals \| Our Malviya Nagar Store | Who we are, where the counter is, how enquiries work |
| `/brands` | Authorised Electrical Brands Dealer in Delhi \| New Delhi Electricals | Electrical Brands We Carry \| New Delhi Electricals | Brand selection and routing into brand pages and hubs |

Neither page was canonicalised to the homepage, noindexed, or stripped of company information.
Only the overlapping commercial targeting was removed.

### 4. `/category/wires-cables` — Phase 7

Primary `electrical wire price` 4,400/KD26; secondary `house wiring cables` 720/KD11,
`best wire for house wiring` 2,900/KD13. Rewritten around how wire is actually chosen —
conductor size, flame-retardant grade, coil length — naming the real range (Polycab FR-LSH,
Finolex FR/FRLS, 0.75–35 sq mm, 90–300 m coils) and deferring sizing to the circuit design.
Links out to both wire hubs plus 24 product pages. No static price list; no stock claims.

### 5. `/category/circuit-protection` — Phase 8

Primary `rccb price` 9,900/KD21; also `rccb` 27,100/KD21, `mcb` 40,500/KD45, `mcb price` 9,900/KD36.
Rewritten around the real device taxonomy in the catalogue: MCB (C curve), RCCB at 30/100/300 mA,
RCBO, isolators and automatic changeovers, 1–4 pole, 6–125 A. **No dedicated RCCB page was created** —
the category page builds authority first, as Prompt 2 directed. All 132 records are linked.
No installation instructions are given.

### 6. `/category/switches-sockets` — Phase 9

Primary `modular switch price` 1,600/KD23; also `modular switches` 2,900/KD29,
`switches and sockets` 8,100/KD36. Rewritten around the modular method (function module first,
then a plate wide enough to hold it) across the eight catalogue ranges. Links to both switch hubs
and to `/category/plates` as a **complementary** step rather than a competing one, so the two pages
do not target the same query set.

### 7. `/category/plates`, `/category/boxes`, `/category/geysers`

Plates and boxes were given selection-led copy tied to module counts. `/category/geysers` holds a
single record; the page now says so plainly and routes the visitor to an enquiry rather than
implying a range exists. **Recommendation:** this page has no realistic path to
`water heater` 22,200/KD31 until inventory exists.

### 8. `/havells/hdmi-socket-1m-white` — Phase 22 exact-model page

| Field | Value |
|---|---|
| SEMrush keyword | `nl90053nm01w` — 110 / KD 20, position 55 |
| SEMrush source | `semrush-current-rankings.csv` |

**Important factual finding:** the string `nl90053nm01w` does **not** exist anywhere in the current
production catalogue — not as an SKU, model, name or specification. The real SKU of this URL is
`AHFKXXW061`. SEMrush attributes the query to this page, but the page does not contain that model
code, and one was not invented to match the query. What was done instead:

- the real SKU `AHFKXXW061` is rendered in the raw HTML,
- the H1 remains the exact model name, `HDMI Socket 1M - White`,
- the description now identifies the Fabio range, disambiguating it from the three sibling HDMI records,
- breadcrumb Home → Switches & Sockets → Havells → product,
- a contextual link to `/brand/havells/switches-sockets`,
- WhatsApp enquiry carrying the SKU.

No image alt text was added because this record has no catalogue image; no stock photography was
substituted.

---

## New pages created

### `/brand/polycab/wires-cables`

| Field | Value |
|---|---|
| Type | New |
| Primary keyword | `polycab wire price` — 12,100 / KD 22 |
| Secondary cluster | `polycab wire price list` 8,100/KD19; `polycab wire dealer in delhi` 110/KD15; `polycab house wire` 480/KD18 |
| Opportunity score | 94/100 |
| Intent | Transactional + local commercial |
| SEMrush source | `keyword-clusters.md`, `commercial-page-map.md`, `semrush-serp-evidence.md` |
| Current ranking | None. New URL. |
| Inventory evidence | 8 records, FR-LSH, 0.75–16 sq mm, 200 m/300 m coils, 8/8 priced, 7 specification keys |
| Why the page exists | The catalogue holds a complete Polycab house-wire size ladder with full technical and price data; SERP evidence shows local specialist pages at #2/#3/#7/#10 for the Delhi dealer query |
| Title | Polycab Wires & Cables in Delhi \| Dealer, Prices & Quote |
| H1 | Polycab Wires & Cables in Delhi NCR |
| Links in | `/`, `/brand/polycab`, `/category/wires-cables`, `/categories`, `/brands`, `/brand/finolex/wires-cables`, 8 product pages |
| Links out | `/brand/polycab`, `/category/wires-cables`, `/brand/finolex/wires-cables`, `/cart`, `/contact`, 8 product pages |
| CTA | "Get Polycab wire pricing on WhatsApp" (hero + footer), quotation list, contact |
| Schema | BreadcrumbList + ItemList (8 items). No Offer, availability, rating or review. |
| Status | Implemented and prerendered |
| Test result | Pass — SEO output, hydration, CLS 0.005, mobile, WhatsApp event |

Unique to this page: a **price-per-metre** column, because Polycab coil length changes with
conductor size (300 m below 4 sq mm, 200 m above), which makes raw coil prices misleading.

### `/brand/finolex/wires-cables`

| Field | Value |
|---|---|
| Primary keyword | `finolex wire price` — 3,600 / KD 17 |
| Secondary cluster | `finolex wire price list` 1,600/KD14; `finolex wire dealer in delhi` 110/KD12; `finolex electrical wire` 260/KD18 |
| Opportunity score | 94/100 |
| Supporting rank | Parent `/brand/finolex` at SEMrush #29 for `finolex dealers in delhi` |
| Inventory evidence | 16 records, FR (0.75–6 sq mm) and FRLS (10–35 sq mm), 90/100/200/300 m coils, 16/16 priced |
| Title | Finolex Wires & Cables Dealer in Delhi \| Prices & Quote |
| H1 | Finolex Wires & Cables in Delhi NCR |
| Links in | `/`, `/brand/finolex`, `/category/wires-cables`, `/categories`, `/brands`, `/brand/polycab/wires-cables`, 16 product pages |
| Links out | `/brand/finolex`, `/category/wires-cables`, `/brand/polycab/wires-cables`, `/cart`, `/contact`, 16 product pages |
| CTA | "Get Finolex wire pricing on WhatsApp", quotation list, contact |
| Schema | BreadcrumbList + ItemList (16 items) |
| Test result | Pass — CLS 0.006 |

Unique to this page: the **FR vs FRLS grade split** (where each grade sits in the size range) and
the **90 m short-coil** option for single-room and repair work. Neither fact applies to Polycab.

### `/brand/anchor/switches-sockets`

| Field | Value |
|---|---|
| Primary keyword | `anchor switches` — 22,200 / KD 31 |
| Secondary cluster | `anchor modular switches` 2,400/KD30; `anchor sockets` 880/KD23; `anchor switch price` 2,900/KD28 |
| Opportunity score | 89/100 |
| Inventory evidence | 162 records, Penta range, 1M–4M widths, 6–32 A, White/Graphite/Red, 162/162 priced, 16 spec keys |
| Title | Anchor Switches & Sockets in Delhi \| Modular Range & Quote |
| H1 | Anchor Modular Switches & Sockets |
| Links in | `/`, `/brand/anchor`, `/category/switches-sockets`, `/categories`, `/brands`, `/brand/havells/switches-sockets`, 162 product pages |
| Links out | `/brand/anchor`, `/category/switches-sockets`, `/category/plates`, `/brand/havells/switches-sockets`, `/cart`, `/contact`, 162 product pages grouped by function |
| CTA | "Get Anchor switch pricing on WhatsApp", quotation list, contact |
| Schema | BreadcrumbList + ItemList (162 items) |
| Test result | Pass — CLS 0.004, mobile no horizontal overflow |

The ambiguous query `anchor in delhi` is **not** targeted; nothing in the title, H1, description or
body optimises for it. Unique to this page: module-count-before-plate-count guidance and the
hospitality module set (keycard, shaver).

### `/brand/havells/switches-sockets`

| Field | Value |
|---|---|
| Primary keyword | `havells switches` — 4,400 / KD 31 |
| Secondary cluster | `havells modular switches` 590/KD23 |
| Opportunity score | 84/100 (P1) |
| Inventory evidence | 201 canonical records across Signia and Fabio, 1M/2M/4M, 6–32 A, four finishes, 201/201 priced, 21 spec keys |
| Title | Havells Switches & Sockets in Delhi \| Modular Range & Quote |
| H1 | Havells Modular Switches & Sockets |
| Links in | `/`, `/brand/havells`, `/category/switches-sockets`, `/categories`, `/brands`, `/brand/anchor/switches-sockets`, 201 product pages |
| Links out | `/brand/havells`, `/category/switches-sockets`, `/category/plates`, `/brand/anchor/switches-sockets`, `/cart`, `/contact`, 201 product pages |
| CTA | "Get Havells switch pricing on WhatsApp", quotation list, contact |
| Schema | BreadcrumbList + ItemList (201 items) |
| Test result | Pass |

Unique to this page: the **two-range decision** (Signia vs Fabio, do not mix on one plate), the
non-switching modules the catalogue actually carries (relay switches, scene controllers, BLDC fan
regulators, USB charging, shuttered sockets), and the four-finish palette. No sentence is shared
with the Anchor page.

---

## Pages held or rejected

| Page | Decision | Reason |
|---|---|---|
| `/brand/havells/wires-cables` | **REJECTED** | Zero Havells wire records. Revisit only if the catalogue gains Havells wire inventory. |
| `/brand/havells/circuit-protection` | **REJECTED** | Zero Havells circuit-protection records; all 132 are Lauritz Knudsen. |
| `/brand/havells/water-heaters` | **REJECTED** | One geyser SKU. A hub over a single product is a thin page. |
| `/category/wires-cables/house-wires` | **REJECTED** | All 24 wire records are house wire, so the child would duplicate the parent and cannibalise it. Intent stays on `/category/wires-cables`. |
| `/electrical-shop-gurgaon` | **DEFERRED** | Per Prompt 3 Phase 24. No unique operational or service-area content exists in the repository to justify it. Backlog. |
| `/electrical-shop-noida` | **DEFERRED** | Same. Backlog behind Gurgaon. |
| Lauritz Knudsen × circuit protection | **NOT BUILT** | Deepest inventory in the catalogue but no measured query cluster. Prompt 2's deferral preserved. |
| Dedicated RCCB page | **NOT BUILT** | Category page builds authority first, per Prompt 2. |
| Distributor / dealer / supplier / wholesaler Delhi pages | **NOT BUILT** | Business relationship is **authorised dealer**. Not claimed otherwise anywhere. |
| Brand × city pages, year-specific price-list URLs | **NOT BUILT** | Explicitly out of scope. |

---

## Cannibalization handling

`electrical company in delhi` (320/KD23) currently ranks on `/` (#46), `/about` (#63) and
`/brands` (#78) per SEMrush 2026-08-30.

- `/` now carries the local commercial targeting in title, H1, body and proposition block.
- `/about` and `/brands` had their competing Delhi dealer/company phrasing removed from titles,
  descriptions, H1s and body copy, and were given distinct jobs.
- Internal anchor text to `/about` and `/brands` is descriptive of their job, not commercial.
- No canonical was pointed at the homepage; neither page was noindexed; no company information was
  removed.

Effect is unverified until GSC data exists.

---

## Internal linking

### Before

| Source | Products linked |
|---|---:|
| Home | 12 |
| 6 category pages | 24 each |
| 5 brand pages | 24 each |
| **Distinct products reachable** | **166 of 1,918** |

### After

| Source | Products linked |
|---|---:|
| Home | 12, brand-balanced |
| 6 category pages | 60 brand-balanced cards + a complete catalogue index of every product in the category, grouped by brand |
| 5 brand pages | 60 cards + hub, category and sibling-brand link groups |
| 4 commercial hubs | 100% of their own range (8 / 16 / 162 / 201) |
| Product pages | parent brand, parent category, and the matching hub where one exists |
| **Distinct products reachable** | **1,918 of 1,918 — zero orphans** |

Hub structure:

```
/  ──> /category/*            ──> brand hubs in that category ──> products
   ──> /brand/*               ──> that brand's hubs           ──> products
   ──> /brand/<b>/<category>  ──> parent brand, parent category, sibling hub, products
```

Anchor text is contextual and descriptive ("Finolex Wires & Cables in Delhi NCR",
"Havells switches and sockets"). No identical exact-match keyword link was injected across the
1,918 product pages; each product links only to its own brand, category and hub.

---

## CRO

- **Primary — WhatsApp:** every commercial hub carries a hub-specific WhatsApp CTA above the fold
  and again in the closing block, prefilled with the brand and category ("I would like a quotation
  for Polycab wires and cables. My requirement is:"). Home, category and brand pages carry a
  WhatsApp CTA in the header block.
- **Secondary — quotation:** every hub links to the quotation list (`/cart`) and to `/contact`.
  The existing cart → "Proceed to Enquire" → customer form → WhatsApp handoff flow is unchanged.
- **Above the fold** answers: what is sold, which brand and category, that Delhi NCR is served,
  how many catalogue products are listed, the catalogue price range, and both conversion paths.
- **No new floating CTAs** were added. The existing single `WhatsAppFab` is unchanged.
- **Mobile:** verified at 390×844 — H1 visible, CTA visible, no horizontal overflow.
- **Product discovery:** hub → facet summary → grouped product grid → product page → cart → quote.
- **Forms:** the quotation form was audited and left unchanged. It asks for name, business name and
  WhatsApp number only; validation, success and failure states already exist. No new required field
  was introduced, and the submission architecture is untouched.

---

## Analytics

The Prompt 1 event taxonomy is preserved exactly: `whatsapp_click`, `whatsapp_enquiry_start`,
`quote_enquiry_start`, `quote_enquiry_submit`, `quote_enquiry_handoff`, `contact_form_submit`,
`phone_click`. No event was added, renamed or duplicated.

One property was extended: `getPageType()` now returns `commercial-hub` for a three-segment
`/brand/<brand>/<hub>` path. `/brand/<brand>` still returns `brand`. Hub CTAs additionally carry
`cta_location` values of `hub_hero_<brand>_<category>` and `hub_footer_<brand>_<category>`.

Never sent: name, email, phone number, form text, WhatsApp message body, search-query text. This is
asserted by the browser suite, which fails if any conversion payload contains the message text or
form values.

Firing is exactly once per action — asserted for the hub WhatsApp CTA, which produces exactly
`['whatsapp_click', 'whatsapp_enquiry_start']`.

---

## Schema

| Route kind | Schema emitted |
|---|---|
| Home | LocalBusiness (unchanged) |
| Category | BreadcrumbList (unchanged) |
| Brand | BreadcrumbList (unchanged) |
| **Commercial hub (new)** | **BreadcrumbList + ItemList** |
| Product | Product + BreadcrumbList (unchanged) |

`ItemList` is emitted only on hub pages, where the visible page genuinely is the product list it
describes, and carries only position, name and URL.

**No `Offer`, `availability`, `InStock`, `aggregateRating`, `review`, `priceValidUntil`, `gtin` or
`mpn` was introduced.** `npm test` fails the build if any of these appear in any generated document.
No FAQPage schema was emitted — the hub FAQs are visible page content only, and were not written to
earn a rich result.

---

## Product indexation

- **No mass noindex was performed.** All 1,918 canonical product routes remain indexable.
- Canonical collisions: **32** (unchanged from the Prompt 1 production count). The stale "~36"
  figure in `product-indexation-strategy.md` has been corrected to the current build value.
- **136 product documents previously shared a title and description with a sibling.** These are
  colour and range variants that were never renamed in the source data. Titles and descriptions are
  now disambiguated using the record's own `series`, `specs.color` or SKU — for example
  "100W, Dura Fan Regulator, 2 Module — Graphite". No content was invented; the qualifier is read
  from the record. A regression test now fails the build on any duplicate title or description.
- H1s on those sibling pages remain the product name. The durable fix is unique product names in the
  catalogue source; 165 name groups covering 343 records are affected.
- Tier scoring was **not** applied to consolidate or deindex anything, because GSC evidence is not
  available.

---

## SSR / rendering

Commercial hubs use the Prompt 1 architecture unchanged: `StaticRouter` + `renderToString` at build
time, `hydrateRoot` in the browser, one shared `CommercialHubView` component rendered by both the
prerender and the client route, and a route-scoped payload in `window.__NDE_INITIAL_ROUTE_DATA__`.
The hub definition itself is static and shared, so only a `{ brandSlug, slug }` reference is
serialised.

Raw HTML for each hub contains: title, description, canonical, one H1, breadcrumb, intro, dealer
block, facet summary, full product grid with crawlable links, buying guidance, applications, FAQs,
related links, both CTAs and JSON-LD. No client-only SEO page was created.

---

## Test results

| Gate | Result |
|---|---|
| `npm ci` | Pass |
| `npm run build` | Pass — 1,940 indexable routes, 1,918 products, 4 hubs, production API |
| `npm test` (SEO output) | Pass — 1,940 routes, 1,940 passed, 0 failures, 0 warnings |
| `npm run test:browser` | Pass — 27/27 |
| `git diff --check` | Clean |
| `tsc --noEmit` | Clean |
| `npm run lint` | 95 errors, all pre-existing; 0 in any file added or changed by Prompt 3 |

New validator assertions: unique title and description across every indexed route; each declared
hub present in the sitemap with exactly one H1, a breadcrumb, a WhatsApp path, a quotation path,
BreadcrumbList, and an ItemList whose count matches the rendered grid.

Hydration mismatch warnings: 0. Root replacement warnings: 0. Page errors: 0.

CLS (Playwright, release budget ≤ 0.1):

| Route | CLS |
|---|---:|
| `/` | 0.021 |
| `/category/switches-sockets` | 0.002 |
| `/brand/havells` | 0.001 |
| `/brand/polycab/wires-cables` | 0.005 |
| `/brand/finolex/wires-cables` | 0.006 |
| `/brand/anchor/switches-sockets` | 0.004 |
| Havells product | 0.002 |
| Finolex product | 0.002 |

### Known harness limitation

One browser assertion could not be made locally: after an in-app navigation from a hub to a product,
the client `ProductSlugPage` fetches the live catalogue API, and the production origin does not allow
`http://127.0.0.1:4173`, so the request is blocked by CORS and the page renders "Product not found".
This is an environment restriction, not a code defect — the same product URL renders correctly on a
direct load from its prerendered document, which is what a search visitor receives. The test now
asserts the part the harness owns: the link resolves to the right URL and back/forward restores the
hub. **This should be re-verified against the deployed site.**

---

## Lighthouse (mobile, local prerendered server)

| Page | Route | Performance | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|
| Home | `/` | 61 | 100 | 6.5 s | 0.09 | 50 ms |
| Category | `/category/wires-cables` | 63 | 100 | 6.7 s | 0 | 60 ms |
| Category | `/category/circuit-protection` | 58 | 100 | 6.9 s | 0.066 | 180 ms |
| Brand | `/brand/finolex` | 62 | 100 | 6.7 s | 0 | 0 ms |
| **Hub** | `/brand/polycab/wires-cables` | 61 | 100 | 6.9 s | 0 | 0 ms |
| **Hub** | `/brand/anchor/switches-sockets` | 59 | 100 | 7.4 s | 0 | 10 ms |
| Product | `/finolex/finolex-fr-0-75-sqmm-300m-house-wire` | 63 | 100 | 6.4 s | 0 | 0 ms |

The new hubs sit inside the same 58–63 band as the pre-existing page types, so there is no
hub-specific regression. These are simulated-mobile scores against an uncompressed local static
server and are not production numbers.

### Measured cost of the catalogue index

The complete catalogue index that removes all 1,752 orphans was measured on the largest category:

| `/category/plates` | Without index | With index |
|---|---:|---:|
| Raw HTML | 55 KB | 348 KB |
| Gzipped | 7.6 KB | 25.6 KB |
| Performance | 62 | 59 |
| LCP | 6.7 s | 8.0 s |
| CLS | 0 | 0 |
| TBT | 0 ms | 0 ms |

3 Lighthouse points and +1.3 s simulated LCP on the two largest category pages
(`/category/plates`, `/category/switches-sockets`); the other four are small enough for the cost to
be negligible. The LCP delta is an upper bound, because the local harness serves uncompressed HTML
while production serves ~26 KB compressed. CLS and TBT are unaffected. This was judged a fair trade
for eliminating every orphan, and is recorded so it can be revisited if field data disagrees.

---

## Google Search Console

**GSC DATA PENDING.** No connector or export is available. No clicks, impressions, CTR, GSC
positions or index-coverage figures appear in this document. The export required is specified in
`gsc-data-required.md`. Once available it should be merged into the SEMrush master rather than
replacing it, and used to decide product consolidation, cannibalization confirmation and the
second commercial batch.

**No ranking improvement is claimed.** Nothing in this document asserts that any position has moved.
