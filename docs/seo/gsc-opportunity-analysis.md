# Google Search Console opportunity analysis

Research date: 2026-08-28 (Asia/Kolkata)

## Evidence status

Google Search Console was connected on 2026-08-27, but this workspace contains no accessible Performance, Page Indexing, sitemap, URL Inspection, or query-to-page export. There is therefore **no defensible historical GSC dataset** from which to calculate organic clicks, impressions, CTR, average position, ranking movement, branded/non-branded splits, cannibalisation, or page-level quick wins.

Do not record unavailable values as zero. The scorecards below deliberately use `Insufficient GSC data`, not estimates. SEMrush API metrics are also unavailable because its API-unit balance is exhausted; they are not a substitute for GSC.

## Current quantitative baseline

| Metric | Value | Evidence |
| --- | ---: | --- |
| Organic clicks | Insufficient GSC data | No accessible GSC export |
| Organic impressions | Insufficient GSC data | No accessible GSC export |
| CTR | Insufficient GSC data | Cannot be calculated |
| Average position | Insufficient GSC data | No query/page report |
| GSC positions 1–3 | Insufficient GSC data | No query/page report |
| GSC positions 4–10 | Insufficient GSC data | No query/page report |
| GSC positions 11–20 | Insufficient GSC data | No query/page report |
| GSC positions 21–50 | Insufficient GSC data | No query/page report |

## Evidence-led existing-page opportunities

These are **implementation opportunities, not GSC quick wins**. They are ranked by catalogue fit, commercial intent, live-SERP support and the site’s existing canonical architecture.

| Priority | Existing URL | Cluster | Current GSC | Why prioritise now | Exact improvement |
| ---: | --- | --- | --- | --- | --- |
| 1 | `/category/wires-cables` | wire/cable supplier, Polycab and Finolex | Insufficient GSC data | Local SERPs show specialist distributors, directories and quote journeys; NDE carries both core brands. | Add buyer-facing category copy, brand collection links, wire type/size enquiry prompt and a project/bulk WhatsApp CTA. |
| 2 | `/category/circuit-protection` | MCB, RCCB, RCBO | Insufficient GSC data | High product-commercial fit and clear technical selection need. | Group MCB/RCCB/RCBO inventory, expose rating/pole terminology in copy and link to the selection guide once reviewed. |
| 3 | `/category/switches-sockets` | modular switches, sockets | Insufficient GSC data | Delhi SERP is local/dealer plus manufacturer heavy; NDE can compete on multibrand selection. | Add compatibility path to plates/boxes, brand modules, model links and a selection WhatsApp CTA. |
| 4 | `/brand/polycab` | Polycab wire/cable local purchase | Insufficient GSC data | Live results include distributors and directories; this is the clearest brand × category overlap. | Make wire/cable depth explicit, link directly to relevant SKUs/category and add fulfilment/quotation proof. |
| 5 | `/brand/finolex` | Finolex wire/cable local purchase | Insufficient GSC data | Same buyer journey as Polycab, with a manufacturer dealer locator in the SERP. | Surface actual wire ranges, category links and stock/quote CTA; do not claim authorisation without proof. |
| 6 | `/brand/lauritz-knudsen` | LK switches/switchgear | Insufficient GSC data | Brand-specific local searches are commercially strong but manufacturer pressure is likely. | State only supportable relationship, feature stocked categories and link to exact models. |
| 7 | `/brand/havells` | Havells electrical range | Insufficient GSC data | Broad brand intent; needs category segmentation to avoid a generic catalogue page. | Add current stocked categories, buyer segment links and clear availability request. |
| 8 | `/category/plates` | modular plates/grid frames | Insufficient GSC data | Supports the switches journey and prevents plate/product filters from becoming index targets. | Add series/module compatibility explanations and links into switches, boxes and product models. |
| 9 | `/category/boxes` | mounting boxes | Insufficient GSC data | Clear purchase-support need and a defensible subcategory. | Add flush/surface, material and sizing selection copy, exact product links and size enquiry CTA. |
| 10 | `/category/geysers` | geysers/water heaters | Insufficient GSC data | Existing category can own stock/quote intent before separate location pages. | Organise instant/storage/capacity options, product links and a capacity-selection CTA. |

## Required GSC export and analysis run

Export the last 16 months (or all available history) for **Web / India**, preserving raw CSVs in `docs/seo/source-data/gsc/`:

1. Performance by query + page: clicks, impressions, CTR, position.
2. Performance by page, query, country and device.
3. Page Indexing and Sitemap reports; sample URL Inspection statuses for category, brand and product templates.

Then classify every query/page pair:

| Band | Decision rule |
| --- | --- |
| 1–3 | Protect title/H1/intent match, strengthen internal links, check CTR drop. |
| 4–10 | Highest priority: improve commercial copy, entity coverage, internal links, title/description and conversion CTA. |
| 11–20 | Expand or refocus the current page; create a new page only if the intent is genuinely distinct. |
| 21–50 | Diagnose mismatch, thinness or competition; consolidate rather than template new URLs. |

Flag high-impression/low-CTR queries, commercial queries landing on informational pages, multiple URLs for one query, and proven queries without a matching canonical page. Recalculate `keyword-master.csv` from the raw export, never from screenshots or manually remembered figures.

## GSC acceptance criteria for the first 30 days

- Existing page has meaningful impressions and commercial/relevant query intent.
- Its average position is approximately 4–20, or it has a clear page-intent mismatch.
- The change can be observed by URL and query in the next reporting window.
- `whatsapp_click`, `whatsapp_enquiry_start`, quote events and organic landing-page path are captured before judging conversion impact.
