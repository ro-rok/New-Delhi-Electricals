# Content Implemented — Prompt 4

Implemented 2026-09-01. Editorial closure and production release completed 2026-09-01 (Prompt 4.1).

## Content architecture

| | |
|---|---|
| Existing architecture found | **None.** The repository had no blog, article, MDX or content-collection system. |
| New architecture | Typed content modules under `src/content/guides/`, rendered by `src/components/guides/GuideView.tsx` |
| Route family | `/guides/<slug>`, index at `/guides`. No date-based URLs, no tag or author archives. |
| Source format | TypeScript structured blocks (`p`, `h3`, `list`, `table`, `callout`, `catalogue`), not Markdown — keeps a parser out of the client bundle and guarantees identical server and browser trees |
| SSR | Full prerender via the existing `scripts/generate-seo.js` pipeline. Every guide is a static document with the complete article in raw HTML. |
| Sitemap | Automatic. `/guides` and each `/guides/<slug>` are added to `routeSet`; total indexable routes 1,972 → **1,978**. |
| Schema | `Article` + `BreadcrumbList` per guide; `BreadcrumbList` + `ItemList` on the index. No `FAQPage`. |
| Indexation control | Only guides listed in `src/content/guides/manifest.ts` are prerendered, indexed or sitemapped. A draft that is not in the manifest cannot ship as a thin indexable page. |
| Author | `Organization` — New Delhi Electricals. No human author is fabricated. |
| Dates | `datePublished` / `dateModified` = 2026-09-01, the real authoring date. |
| Images | **None.** No decorative photography was added. Comparison content is delivered as HTML tables, which cost no bytes, cause no CLS and are readable by assistive tech. |

### Payload isolation

The article prose is ~75 kB of text. A naive static import put all of it in the shared entry
chunk: measured **+22.2 kB gzip on every route** (115.2 → 137.4 kB). That was rejected.

The final split:

- `src/content/guides/manifest.ts` — titles, descriptions and commercial parents only. This is
  the single source of truth for those fields and the only guide module shared routes import.
- `src/content/guides/index.ts` — merges each manifest entry with its article body. Imported only
  by the server entry and by a dynamic `import()` inside `GuidePage`.
- The prerendered document serialises the whole guide into `window.__NDE_INITIAL_ROUTE_DATA__`,
  so a visitor arriving from search hydrates the full article **with no fetch and no flash**.
- In-app navigation to a guide pulls a 71 kB async chunk (22.0 kB gzip) that no other route,
  including a guide landing page, ever requests.

Net cost to every non-guide route: **+1.4 kB gzip** (116.6 vs 115.2 kB baseline).

The build fails if a body module has no manifest entry, or a manifest entry has no body.

---

## Articles implemented

### 1. `/guides/best-wire-for-house-wiring`

| | |
|---|---|
| **Title** | Which Wire Is Best for House Wiring? A Buyer's Guide (India) |
| **Primary keyword** | which wire is best for house wiring — 590 vol / KD 7 |
| **Secondary cluster** | which company wire is best for house wiring (590/KD 5), which is the best wire for house wiring (590/KD 9), which company wire is best for house wiring in india (480/KD 14), which cable is best for house wiring (170/KD 9) |
| **Intent** | Commercial investigation — pre-purchase selection, not textbook theory |
| **Commercial parent** | `/category/wires-cables` |
| **Supporting hubs** | `/brand/polycab/wires-cables`, `/brand/finolex/wires-cables` |
| **Internal links out** | Both wire hubs, the wires category (×2 contextual), 6 product pages, `/guides/genuine-finolex-wire`, `/contact`, `/cart` |
| **CTA** | "Send your wiring list on WhatsApp" + "Browse wires & cables" + "Request a quotation" |
| **Schema** | Article, BreadcrumbList |
| **Catalogue evidence** | Finolex FR 1.0/1.5/2.5 sq mm, Polycab FR-LSH 2.5/4 sq mm, Finolex FRLS 10 sq mm — all SKUs and list prices verified against the production API |
| **SERP evidence** | Top results are manufacturer blogs (Fybros, RR Kabel), a property portal listicle and a cable-brand ranking page. All lead with brand lists. **Gap:** none separate conductor size from insulation grade from brand, and none say plainly that ISI certification under IS 694 makes the brand the least consequential decision. That inversion is this guide's angle. |
| **Expert input pending** | None |

### 2. `/guides/genuine-finolex-wire`

| | |
|---|---|
| **Title** | How to Check Finolex Wire Is Original: Verifiable Checks |
| **Primary keyword** | finolex wire original — 140 vol / KD 14 |
| **Intent** | Pre-purchase trust — the question asked immediately before or after buying |
| **Commercial parent** | `/brand/finolex/wires-cables` (a Prompt 3 money page) |
| **Supporting hubs** | `/category/wires-cables` |
| **Internal links out** | Finolex wire hub (×2), wires category, 6 Finolex product pages, `/contact`, `/cart` |
| **CTA** | "Get Finolex wire pricing on WhatsApp" + "Browse Finolex wires & cables" |
| **Schema** | Article, BreadcrumbList |
| **Catalogue evidence** | Finolex FR 1.5 (90 m and 300 m), FR 2.5 300 m, FR 4 200 m, FRLS 10 and 25 sq mm — SKUs and prices verified |
| **SERP evidence** | Existing content is dominated by visual "spot the fake" checklists (print quality, hologram, feel). **Gap:** none of them uses the free BIS CARE app to resolve the CM/L licence number against the Bureau of Indian Standards' own database — a check that cannot be faked and takes under a minute. That is the spine of this guide. |
| **Safety of claims** | No unverifiable anti-counterfeit claim is made. The Finolex portal at check.finolex.com is described only as far as it is verifiable, and the article explicitly warns that manufacturer features change and should be confirmed with the manufacturer. |
| **Expert input pending** | **None — resolved 2026-09-01 from first-party evidence.** Finolex's own portal at `check.finolex.com` is titled "True Product Checker" and works one way only: a camera QR scan. There is no manual code-entry field, no SMS route and no scratch panel. Its on-page instruction before the camera opens is *"SCAN ONLY EXTERNAL QR CODE"*; a recognised code returns a genuine-product confirmation, an unrecognised one an explicit rejection rather than a blank screen. Finolex does **not** publish where the code sits on a house-wire coil, and no authoritative source ties the code to a loyalty programme — so the guide claims neither, and directs buyers to the verification instructions printed on the pack they received. BIS CARE / CM-L licence lookup remains the guide's principal verifiable check. |

### 3. `/guides/mcb-vs-mccb`

| | |
|---|---|
| **Title** | MCB vs MCCB: The Difference, and Which One You Need |
| **Primary keyword** | what is the difference between mcb and mccb — 210 vol / KD 10 |
| **Intent** | Informational with strong commercial adjacency — asked while specifying a board |
| **Commercial parent** | `/category/circuit-protection` |
| **Supporting hubs** | None (no brand circuit-protection hub exists, and none is invented) |
| **Internal links out** | Circuit protection category (×2), 6 product pages, `/guides/rccb-explained`, `/guides/how-to-choose-mcb-for-home`, `/contact`, `/cart` |
| **CTA** | "Send your board schedule on WhatsApp" + "Browse circuit protection" |
| **Schema** | Article, BreadcrumbList |
| **Catalogue evidence** | LK MCB 6/16/20/40/63 A and the 100 A four-pole isolator — SKUs and prices verified. The guide states plainly that **the catalogue holds no MCCBs**, and offers to quote against a specification instead of implying stock. |
| **SERP evidence** | Results are split between manufacturer blogs (Schneider, Lauritz Knudsen, CHINT) and low-quality aggregators. Several contain outright errors — one widely-ranking page claims MCBs have only 1–3 poles (our own catalogue lists four-pole MCBs) and quotes an MCB interrupting rating in amps rather than kA. **Gap:** almost none explains *why* the two families exist — that prospective fault current falls as you move down an installation — which is the fact that makes the distinction make sense. |
| **Expert input pending** | None |

### 4. `/guides/how-to-choose-mcb-for-home`

| | |
|---|---|
| **Title** | How to Choose an MCB for Home Circuits (Including AC Points) |
| **Primary keyword** | which mcb is best for home — 210 vol / KD 9 |
| **Secondary cluster** | which mcb is best for 1.5 ton ac — 110 vol / KD 15 (merged as a named section) |
| **Intent** | Commercial investigation — sizing a board before ordering |
| **Commercial parent** | `/category/circuit-protection` |
| **Supporting hubs** | `/category/wires-cables` (the cable sets the ceiling on the rating) |
| **Internal links out** | Circuit protection (×2), wires & cables, 7 product pages, `/guides/mcb-vs-mccb`, `/guides/rccb-explained`, `/contact`, `/cart` |
| **CTA** | "Get MCB pricing on WhatsApp" + "Browse circuit protection" |
| **Schema** | Article, BreadcrumbList |
| **Catalogue evidence** | LK MCB 6/10/16 A SP, 16/20/40 A DP, RCBO 16 A 30 mA — SKUs and prices verified |
| **SERP evidence** | The AC query is served by manufacturer selection guides and by thin one-answer FAQ pages that give "16 A" with no reasoning. **Gap:** virtually none states the constraint that actually governs the choice — the rating must not exceed the cable's capacity — which is precisely why upsizing a breaker to stop nuisance tripping is dangerous. That is the guide's opening section. |
| **Expert input pending** | None |

### 5. `/guides/rccb-explained`

| | |
|---|---|
| **Title** | RCCB Explained: What It Does, How It Works, Which Rating |
| **Primary keyword** | what is rccb in electrical — 480 vol / KD 21 |
| **Secondary cluster** | how rccb works — 110 vol / KD 12 (merged; same SERP) |
| **Intent** | Informational, converting into a device selection |
| **Commercial parent** | `/category/circuit-protection` |
| **Supporting hubs** | None |
| **Internal links out** | Circuit protection (×2), 7 product pages, `/guides/how-to-choose-mcb-for-home`, `/guides/mcb-vs-mccb`, `/contact`, `/cart` |
| **CTA** | "Get RCCB pricing on WhatsApp" + "Browse circuit protection" |
| **Schema** | Article, BreadcrumbList |
| **Catalogue evidence** | RCCB 25/40/63 A at 30/100/300 mA in 2P and 4P, RCBO 16 A and 32 A 30 mA — SKUs and prices verified. The guide also uses our own subcategory label "Residual Current Circuit Breakers (RCCBs/ELCBs)" to explain how the two terms are used interchangeably in the Indian trade. |
| **SERP evidence** | Sensitivity-comparison content is heavily dominated by overseas component manufacturers writing for a global audience. **Gap 1:** almost none explains that the two numbers on the device (amps and milliamps) are unrelated — which is the most common specification error we see on enquiries. **Gap 2:** none addresses Type AC versus Type A, which matters increasingly as homes fill with inverter ACs and electronic loads. |
| **Expert input pending** | **None — resolved 2026-09-01 as "not classifiable from published data".** Lauritz Knudsen's own product data for the catalogue numbers we carry (checked on BC204003) publishes a full 21-attribute specification — conformance **IS 12640-1**, 40 A, 30 mA, DP, 6 kA, 240 V, etc. — and states **no residual-current type**. Neither the official RCCB range page nor the RCBO range page names Type AC or Type A. No type is therefore claimed on the manufacturer's behalf. The section explains Type AC vs Type A conceptually and a callout tells buyers the type is a marked characteristic of a specific device, not derivable from rating, sensitivity, pole count or catalogue name, and that we will confirm it against the datasheet for the exact catalogue number on request. |

---

## Commercial → article links

Added, and enforced by a test:

| Commercial page | Links to |
|---|---|
| `/category/wires-cables` | best-wire-for-house-wiring, genuine-finolex-wire, how-to-choose-mcb-for-home |
| `/category/circuit-protection` | mcb-vs-mccb, how-to-choose-mcb-for-home, rccb-explained |
| `/brand/finolex/wires-cables` | genuine-finolex-wire, best-wire-for-house-wiring |
| `/brand/polycab/wires-cables` | best-wire-for-house-wiring |
| Footer (sitewide) | `/guides` |

`/brand/anchor/switches-sockets` and `/brand/havells/switches-sockets` render **no** guide block,
because no guide legitimately supports them yet. `GuideLinkCards` returns `null` rather than
emitting filler links.

---

## Test gates added to `scripts/test-seo-output.js`

Per published guide:

- present in the sitemap and has a generated document
- exactly one H1, a breadcrumb nav, an `<article>` element, at least 3 `<h2>` sections
- a WhatsApp conversion path
- a link to its declared commercial parent, and to every declared supporting page
- valid `Article` schema carrying headline, description, datePublished, dateModified, author,
  publisher and mainEntityOfPage; ISO date format; headline ≤ 110 characters
- `BreadcrumbList` present, `FAQPage` **absent**
- every internal anchor resolves to a document this build generated (broken-link gate)

Plus: the index links every published guide, and every commercial parent links back to its guide.

## Test gates added to `tests/seo-hydration.spec.ts` (17 new tests, all passing)

- `/guides`, `/guides/best-wire-for-house-wiring` and `/guides/rccb-explained` join the shared
  no-JS → hydration suite (canonical, schema, H1 persistence, zero hydration warnings, CLS ≤ 0.1)
- each of the 5 guides renders a complete article with JavaScript disabled — ≥ 4 `<h2>`,
  > 4,000 characters of visible prose, a WhatsApp path and a link to its commercial parent
- each commercial parent links back to its guide with JavaScript disabled
- a guide on a 390 px viewport has no horizontal overflow and CLS ≤ 0.1
- a guide route loads no GSAP, no cinematic video, no catalogue API call and **not even the
  guide-bodies chunk** — the prerendered document carries the whole article
- the guide WhatsApp handoff carries guide context and fires `whatsapp_click` and
  `whatsapp_enquiry_start` exactly once each, attributed as `page_type: 'guide'`
- guides are crawlable by clicking: home → footer Guides → index → article

## Supporting change

`getPageType()` in `src/lib/conversionTracking.ts` classified `/guides/<slug>` as `product`,
because it is a two-segment path. Guides now report `guides-index` and `guide`, so guide-sourced
enquiries are attributable in the conversion data rather than being counted as product enquiries.

---

## Prompt 4.1 — editorial closure and release (2026-09-01)

Prompt 4 shipped locally with two editorial placeholders, one unverified sitewide trust claim
and one pre-existing hydration failure. All four are closed here. No new articles were written
and no article was restructured.

### Factual verification

| Claim | Method | Outcome |
|---|---|---|
| Finolex on-pack authenticity mechanism | First-party: Finolex's own portal at `check.finolex.com` | **Verified.** Camera QR scan only, "True Product Checker", instruction "SCAN ONLY EXTERNAL QR CODE", explicit genuine/not-genuine responses. Code *location* on a coil and any loyalty linkage are **not** published, so neither is claimed. |
| RCCB Type AC vs Type A for the LK range | First-party: Lauritz Knudsen product data (BC204003) and the official RCCB and RCBO range pages | **Not classifiable.** LK publishes a full specification and conformance to IS 12640-1 but no residual-current type. No type claimed; section rewritten conceptually with a check-the-marking callout. |
| Footer `27 Years of Trusted Service · 3000+ Happy Customers` | Repository and business documentation search | **Unsupported.** Nothing in the repo or the business docs evidences either figure, and "27 years" also contradicts the site's own "since 1998" (which would be 28). Replaced, not restated — see below. |

### Source integrity

Every source URL across the five guides was fetched and checked. Three were dead and are fixed:

| Was | Now |
|---|---|
| `webstore.iec.ch/publication/60533` (404) | `webstore.iec.ch/en/publication/21972` — IEC 60898-1:2015 |
| `webstore.iec.ch/publication/63382` (404) | `webstore.iec.ch/en/publication/25040` — IEC 60947-2:2016 |
| `webstore.iec.ch/publication/63991` (404) | `webstore.iec.ch/en/publication/67980` — IEC 61008-1:2024 |

Added: **IS 12640 (Part 1)** — the standard the RCCBs we sell are actually declared to — via the
BIS-hosted product manual, plus the two official Lauritz Knudsen range pages. All 14 source URLs
now resolve. (`check.finolex.com` serves an incomplete TLS chain that Node's bundled CA store
rejects; browsers and the OS trust store verify it, so it is retained.)

### Trust claims

The numeric claims appeared on five live surfaces, not just the footer. All were replaced with
statements the business can evidence — dealer appointments, the Malviya Nagar counter, and the
catalogue itself (1,950 indexable product records at this build).

| Surface | Was | Now |
|---|---|---|
| `Footer` (every page) | 27 Years of Trusted Service · 3000+ Happy Customers | Authorised dealer · Malviya Nagar counter, serving Delhi NCR · Genuine branded products |
| `home/PremiumHero` | 3000+ Products / 27 Years Trust | 1900+ Products / Authorised Dealer |
| `home/CinematicVideoHero` | 3000+ products · 27 years of trust | 1900+ products · 5 authorised brands |
| `AboutUs` stat tiles | 27+ Years of Service, 3000+ Happy Customers, 1000s Homes Built | 1900+ Catalogue Products, 5 Authorised Brands, 1 Malviya Nagar Counter |
| `AboutUs` prose | "Over 27 years… serving over 3000 customers" | Reworded without counts |
| `WhyChooseUs` | 27 Years Legacy, 3000+ Customers | Established 1998, 1900+ Catalogue Lines |

"Since 1998" is retained: it is the business's own statement about its founding in owner-authored
copy, not a counted metric. **If the owner can evidence the service-year or customer figures, they
can be reinstated with the source recorded — do not reinstate a number without one.**

`src/components/Hero.tsx` and `src/components/home/HeroSection.tsx` still contain the old wording
but are **dead code** — no route imports either, so nothing is published from them. Cleaning or
deleting them is P1 housekeeping, not a live factual issue.

### Anchor hydration order

`/brand/anchor/switches-sockets` was the one pre-existing browser-suite failure.

- **Cause.** 81 of the 162 Anchor records on that hub share a display name with another record,
  differing only by a variant suffix in the URL. Both the generator and `CommercialHubPage` sorted
  on `name.localeCompare(...)` alone, which is not a total order over that set, so each equal-name
  pair kept its source-array position. The prerenderer and the browser read the catalogue from
  different snapshots, so the two orders disagreed and the list reshuffled during hydration.
- **Fix.** One shared comparator, `compareCatalogueProducts` in `src/lib/commercialHubs.ts`:
  lower-cased name by code point, then `urlPath` (falling back to `sku`, then `id`) as the
  tie-break. `orderHubProducts` wraps select-plus-sort and is re-exported through
  `entry-server.tsx`, so `scripts/generate-seo.js` and the client route call the *same function*
  and cannot drift apart again. `CategoryPage` was folded onto the same comparator, removing a
  second private copy of the policy. Comparison is by code point rather than `localeCompare`
  because Node and Chromium resolve different default collations.
- **Verification.** Shuffling the 162-record source array 200 times and sorting yields one
  identical order every time; the old name-only comparator produced 50 distinct orders from 50
  shuffles. The Playwright order assertion was tightened from a 25%-reordering tolerance to exact
  array equality, and passes on every route.
