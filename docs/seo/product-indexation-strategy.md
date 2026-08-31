# Product indexation strategy

## Current verified state

The SEO build snapshot dated 2026-08-28 loaded 1,986 active API products, generated 1,950 unique canonical product routes and excluded 36 duplicate canonical routes. It also generated six category routes and five inventory-backed brand routes. Each indexable product route is statically rendered with a canonical URL, Product and BreadcrumbList structured data; utility search/cart/shortlist/compare routes are `noindex, follow` and excluded from the sitemap.

This is a solid crawlable foundation, but it is **not evidence that every product deserves to stay indexable** or that Google has indexed those routes.

## Indexability rules

| Page state | Recommendation |
| --- | --- |
| Unique active SKU/model with distinct name, brand, usable image/specification and a canonical route | Index; include in sitemap and link from relevant category/brand pages. |
| Colour, pack, module-size or other variant with genuinely distinct commercial query demand and materially distinct visible data | Use a separate canonical URL only when it is independently useful; otherwise consolidate into the parent product. |
| Near-duplicate product sharing a canonical path | Fix source slug/identity; keep only one canonical indexable route. The current build already excludes 36 collisions. |
| Thin product with no useful description/specification/image or no unique buyer choice | Improve the product record first; do not create a thin SEO page merely to increase URL count. |
| Facet, sort, search, cart, compare or shortlist state | `noindex, follow`; no sitemap inclusion. Preserve the current policy. |
| Discontinued/unavailable product with a true replacement | 301 redirect to the closest successor; retain a useful mapping record. |
| Discontinued product with no replacement but valuable links/history | Keep a factual page briefly, then return 410 only when removal is final and links are handled; never redirect every discontinued item to a category homepage. |
| Pagination | Keep clean paginated collection URLs crawlable only if each page has unique listed items and self-canonical; never canonicalise all pages to page 1. |

## Canonical and structured-data policy

- Use one HTTPS `www` canonical per product path, with query parameters removed.
- Product schema must stay factual. Keep `name`, image, SKU/brand and specifications where available. Do not add availability, ratings, reviews, price, Offer or GTIN unless the source data is current, public and reliable.
- Avoid canonical chains. Legacy product URLs should redirect in one hop to the surviving clean URL.
- Add a visible breadcrumb and at least one contextual category/brand link into every product; link related models only where genuinely comparable.

## Phased quality audit

1. Resolve the 36 duplicate canonical products documented in `docs/seo/excluded-products.md` before expanding the sitemap.
2. Export URL Inspection samples for each template (product, category, brand) and identify crawled/not-indexed or duplicate-without-user-selected-canonical patterns.
3. Segment the 1,950 product pages by impressions/clicks after GSC history accrues. Prioritise unique, commercially queried product records for richer data and links.
4. Improve or consolidate low-value templates based on actual index coverage and query evidence—never mass-noindex solely because a product has low traffic in a short window.

## Success measures

Track valid indexed product pages, duplicate/canonical exclusions, product-page impressions by brand/category, organic product-to-WhatsApp starts, and percentage of product records meeting the minimum content standard. Sitemap URL count is only a discovery metric, not an SEO success metric.
