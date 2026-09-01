# Prompt 2 — 30-Day Commercial SEO Implementation Order

This sprint order assumes technical deployment validation is either complete or being closed separately. Do not reopen the entire technical SEO project inside Prompt 2.

> **Status 2026-08-31 (Prompt 3):** Days 1–15 are complete. Days 16–20 (guides) are Prompt 4 and
> were not started. Days 21–24 location decision: homepage owns Delhi/Delhi NCR; Gurgaon and Noida
> remain deferred backlog with no page created. Days 25–27 product indexation: collisions confirmed
> at 32, duplicate metadata fixed on 136 documents, orphans reduced from 1,752 to 0, no mass noindex.
> Days 28–30 measurement is blocked on GSC. See `commercial-pages-implemented.md`.
>
> **Status 2026-09-01 (Prompt 3 production):** the four approved hubs are deployed to Vercel
> production (commit `fdb98a7`) and live-validated — 200 / indexable / accurate schema, hydration
> clean (0 errors, CLS 0), hub→product navigation and cart work on the real production API, CORS
> passes, sitemap holds all four (route total now 1,972 after catalogue growth), rejected/deferred
> URLs 404. Production mobile Lighthouse: hubs Perf 69–75, CLS 0, no regression attributable to
> Prompt 3. Full evidence in `production-validation.md` § "Prompt 3 — Production release + live
> validation". Prompt 4 not started.

## Days 1–3 — Existing-page quick wins
1. Optimize `/brand/finolex` around `finolex dealers in delhi`; preserve authorised-dealer proof. **Done.**
2. Rework homepage targeting around `electrical shops in delhi`, Delhi NCR wholesale/retail and buyer segments.
3. Resolve homepage `/about` `/brands` content overlap for `electrical company in delhi`.
4. Improve `/category/wires-cables` for price/range/house-wire decision intent.
5. Improve `/category/circuit-protection` with strong RCCB + MCB taxonomy/range.
6. Improve `/category/switches-sockets` for modular-switch selection/price.
7. Strengthen exact-model product pages where model/spec search demand exists.

## Days 4–10 — Build only the highest-confidence new hubs
Inventory-gate each page before publishing.

1. Polycab wires & cables — **BUILT** (8 records)
2. Finolex wires & cables — **BUILT** (16 records)
3. Havells wires & cables — **REJECTED at the gate: 0 records in the catalogue**
4. Anchor switches & sockets — **BUILT** (162 records)
5. Havells circuit protection — **REJECTED at the gate: 0 records in the catalogue**

Each page must contain:
- actual live catalogue items
- useful selection/specification structure
- factual dealer status
- Delhi NCR service context
- WhatsApp quote CTA
- quotation/form CTA
- parent/sibling/product internal links

## Days 11–15 — Second commercial batch
If inventory is strong:
6. Havells switches & sockets — **BUILT** (201 records)
7. Havells water heaters — **REJECTED at the gate: 1 record in the catalogue**

Do not create Lauritz Knudsen × category pages yet without measured query demand.

## Days 16–20 — Content that assists commercial rankings
Publish first:
1. Best wire for house wiring — **LIVE** `/guides/best-wire-for-house-wiring` → `/category/wires-cables`
2. MCB vs MCCB — **LIVE** `/guides/mcb-vs-mccb` → `/category/circuit-protection`
3. How to choose MCB for home — **LIVE** `/guides/how-to-choose-mcb-for-home` → `/category/circuit-protection`
4. RCCB explained — **LIVE** `/guides/rccb-explained` → `/category/circuit-protection`
5. How to identify original Finolex wire — **LIVE** `/guides/genuine-finolex-wire` → `/brand/finolex/wires-cables`

Each guide should link into one primary commercial cluster. **All five do, and all five
commercial parents link back.** Index at `/guides`. No sixth guide is planned in this sprint —
Prompt 4 is closed, and the next content decision waits on GSC evidence (Days 28–30).

## Days 21–24 — Location decision
- Homepage remains Delhi/Delhi NCR hub.
- Consider Gurgaon page (260/KD24) only if unique operational content is available.
- Consider Noida page (110/KD28) second.
- No Ghaziabad/Faridabad page in first sprint.
- No duplicate Gurugram page.

## Days 25–27 — Product indexation pilot
- score a representative product sample using `product-indexation-strategy.md`
- fix collision records
- identify cosmetic/duplicate variants
- strengthen exact-model pages with evidence
- do not mass-noindex before GSC evidence

## Days 28–30 — Measurement + iteration
When GSC export is available:
- merge query/page data into master
- identify positions 4–20
- identify high-impression/low-CTR pages
- confirm/refute cannibalization
- choose batch 2 based on actual impressions and WhatsApp/quote events

## 30-day success measures
Primary:
- qualified WhatsApp enquiries from organic landing pages
- quotation/form starts/submits
- growth in non-brand commercial impressions/clicks
- movement of Finolex/Polycab/Havells commercial clusters

Secondary:
- top-20 keyword count
- top-10 commercial keyword count
- number of commercial hubs receiving impressions
- indexed quality pages, not raw indexed-page count

The 1,000 visits/month objective remains a target, not a guarantee.

---

## Off-page and measurement — operational, not engineering (added 2026-09-01, Prompt 4.1)

These items were being tracked alongside the build work, which made Prompt 4 look incomplete when
it was not. **None of them is a code change, and none of them blocks a release.** They are moved
here as 30-day execution work: still high priority, but owner- and account-driven rather than
repository-driven. Nothing in the codebase is waiting on any of them.

| # | Item | Owner action | Priority | Blocks code? |
|---|---|---|---|---|
| 1 | Manufacturer directory outreach | Ask Havells / Polycab / Finolex / Anchor / Lauritz Knudsen territory contacts to list us in their official retailer directories, linked to the matching brand hub. `partners.havells.com` already lists a competing Corner Market retailer, so the catchment accepts listings. | P0 operational | No |
| 2 | Sulekha listing | A live listing for New Delhi Electricals, Corner Market, Malviya Nagar exists with **no phone and no website URL**. Claim it, add the phone and the site, correct the address to 30 A. | P0 operational | No |
| 3 | Tata Nexarc listing | Claim / create the business listing. | P1 operational | No |
| 4 | Google Business Profile audit | NAP byte-identical to *New Delhi Electricals · 30 A Corner Market, Malviya Nagar, New Delhi 110017*, categories, hours, products, photos. | P0 operational | No |
| 5 | Search Console connection | Connect the property and export query/page data. **This is the real gate on Days 28–30** and on every "choose batch 2 from actual impressions" decision in this document. | P0 operational | No |
| 6 | Backlink Gap export | Pull the competitor gap export to prioritise link targets beyond the manufacturer directories. | P1 operational | No |

Two consequences worth stating plainly, so they are not rediscovered later:

- **Measurement is the bottleneck, not content.** Days 28–30, the batch-2 hub decision, the
  cannibalisation question and any sixth guide all depend on GSC data that does not exist yet.
  Publishing more pages before that data arrives is guessing.
- **NAP consistency gates the local work.** Items 2 and 4 must agree byte-for-byte before the
  directory outreach in item 1 is worth doing, or the citations will conflict with each other.
