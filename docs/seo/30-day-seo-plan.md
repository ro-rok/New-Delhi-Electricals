# 30-Day Commercial SEO Plan

The 1,000-organic-visits/month objective is a target, not a guarantee. This plan prioritises qualified Delhi NCR catalogue traffic and WhatsApp/quotation enquiries.

## Days 1–3: deploy and verify the technical release

- Deploy the generated static output to a Vercel preview, then production after approval.
- Verify HTTP status, raw HTML, canonical, robots and schema on home, two categories, all five brands, representative products, search, admin and unknown URLs.
- Confirm legacy category/product redirects have one hop and unknown paths return HTTP 404.
- Confirm the production runtime API setting points to the working catalogue service.
- Validate the 1,972-URL sitemap response and submit it in Google Search Console.

## Days 4–7: establish search and conversion measurement

- Obtain Google Search Console access and record indexed pages, excluded pages, crawl errors, queries, countries and devices without fabricating a historical baseline.
- Verify Vercel custom events for WhatsApp, contact, quotation and telephone CTAs.
- Decide whether GA4 is required in addition to Vercel Analytics. If adopted, use the same event names and non-PII parameters.
- Add a weekly report for organic landing pages to WhatsApp/quotation starts and successful form submissions.

## Days 8–14: commercial landing-page quality

- Review the six existing commercial category pages for unique, customer-useful copy, selection guidance and Delhi NCR relevance.
- Review brand pages for factual authorised-dealer language and ensure each has enough active products.
- Create brand/category landing pages only for combinations with meaningful inventory and unique value. Start with the highest-inventory combinations; do not generate empty combinations.
- Strengthen product-to-brand, product-to-category and related-product anchors using catalogue relationships.

## Days 15–21: catalogue quality and media

- Resolve the 36 active API records excluded from generation because a required canonical name/brand/URL was absent or duplicated.
- Audit missing/broken images and add verified dimensions from the actual media source.
- Create responsive renditions for large product images while preserving official catalogue imagery.
- Review product titles/descriptions for duplication and factual usefulness. Do not invent stock, ratings, offers or identifiers.

## Days 22–30: performance and search feedback loop

- Profile the homepage's long tasks and animation libraries; reduce main-thread work without removing useful UX.
- Defer admin-only analytics/chart code and verify it never enters public-route startup chunks.
- Run production mobile Lighthouse and compare like-for-like deployed URLs.
- Use Search Console query/page data to choose the next commercial page improvement.
- Inspect index coverage and canonical selection after Google has recrawled the sitemap.

## Success checks

- Canonical commercial routes return meaningful HTML without JavaScript.
- Unknown URLs return HTTP 404; admin/search/utilities remain out of the index.
- Sitemap URLs match canonicals and contain only indexable routes.
- WhatsApp and quotation events fire once per intended action and contain no PII.
- Search Console begins reporting valid indexed product/category/brand URLs and commercial query impressions.
