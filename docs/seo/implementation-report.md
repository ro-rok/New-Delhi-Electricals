# Executive Summary

This sprint replaces an all-client-rendered catalogue shell with selective build-time route HTML for canonical public pages. It also corrects canonical/sitemap/indexation architecture, adds factual schema and visible product breadcrumbs, adds non-PII conversion events, removes an unused incompatible build plugin, and changes Vercel routing so unknown public paths can become real 404s after deployment.

## 2026-08-29 release decision

Production was **not deployed**. The SSR recovery has now passed the local build, 1,936-route SEO validation and five representative browser hydration tests. The checked-in handcrafted shell and silent fallback have been replaced by a React server entry and strict production-API build policy. This remains local evidence only; release still needs its separately authorised production validation.

# 1. What Was Wrong

- Live raw HTML for home, category, brand, search, admin and nonexistent URLs was the same 2,498-byte shell.
- Critical metadata was added only after React ran; canonicals included query parameters.
- The sitemap had 10 static URLs, used the non-preferred host and included utility pages while excluding the catalogue.
- Unknown URLs returned HTTP 200 due to a broad SPA rewrite.
- The configured production API host returned deployment-not-found responses.
- Product/brand/category raw HTML had no structured data.
- Conversion events were not consistently sent to a central analytics service.
- `npm ci` had an unresolved Vite peer-dependency conflict.

# 2. What Was Changed

- `frontend/scripts/generate-seo.js`: post-build static route generator. It reads active products from the public production API, falls back to the repository export if unavailable, generates route-specific HTML, sitemap, robots, 404 page and a build report.
- `frontend/package.json`: makes generation part of `npm run build` and adds `npm test` / `test:seo` output assertions.
- `frontend/scripts/test-seo-output.js`: validates representative generated HTML, canonicals, H1s, links, schema, noindex policy and invalid schema claims.
- `frontend/index.html`, `frontend/src/components/SEOHead.tsx`, `frontend/src/lib/seo.ts`: centralised preferred-host canonical behavior, robots support, social metadata and client-side schema synchronization.
- `frontend/src/pages/ProductSlugPage.tsx`: adds visible product breadcrumbs and factual Product/BreadcrumbList schema input.
- `frontend/src/pages/CategoryPage.tsx`: adds category canonical/breadcrumb metadata.
- `frontend/src/pages/NotFound.tsx`: adds noindex not-found metadata.
- `frontend/vercel.json` and `vercel.json`: add clean URLs, legacy redirects, admin-only SPA rewrite and `X-Robots-Tag` for admin.
- `frontend/public/robots.txt`: points to the preferred `www` sitemap.
- `frontend/.env.production`: points the build at the verified working public catalogue API. The deployment environment must be aligned separately.
- `frontend/src/lib/conversionTracking.ts`, `frontend/src/App.tsx`, `frontend/src/pages/ContactPage.tsx`, `frontend/src/pages/CartPage.tsx`: add Vercel custom conversion events without PII.
- `frontend/vite.config.ts`, `frontend/package.json`, `frontend/package-lock.json`: remove unused `vite-imagetools@12`, which was incompatible with Vite 7.

# 3. What Was Deliberately NOT Changed

- No framework migration: selective static generation meets the crawlability requirement without moving the application to Next.js.
- No product availability, ratings, reviews, GTIN, MPN or fabricated offers were emitted. Product Offers appear only where the API provides a positive list price and currency; availability is omitted.
- No mass brand/category pages were created beyond routes with verified active inventory. No empty combinations or locality doorway pages were added.
- No image replacement or artificial dimensions were introduced; official catalogue media remains intact.
- No broad lint/TypeScript cleanup was attempted because those errors are unrelated to this SEO sprint.
- No GA4 or GTM was installed because none was present and no measurement ID/configuration was available.

# 4. Before / After Metrics

| Metric | Before | After | Change |
| ------ | -----: | ----: | -----: |
| Canonical indexable route HTML files | 1 | 1,972 | +1,971 |
| Active canonical product pages | 0 | 1,954 | +1,954 |
| Commercial category pages | 0 | 6 | +6 |
| Inventory-backed brand pages | 0 | 5 | +5 |
| Sitemap URLs | 10 | 1,972 | +1,962 |
| Utility routes in sitemap | 3 | 0 | -3 |
| Raw category/brand/product H1/canonical/schema | absent | present in generated output | fixed |
| Pre-change build time | 73.66 s | 85.03 s | +11.37 s |
| Pre-change output bytes | 4,163,132 | 13,384,854 | +9,221,722 |

The extra build time and output are intentional: the site now emits static documents for commercial routes rather than one empty HTML shell. Generated route HTML is compact (representative files: home 3,616 bytes, category 3,538, brand 3,474, product 4,101).

Pre-change Lighthouse was collected against the live deployment; final Lighthouse was collected against a local static preview, so scores are not a direct before/after comparison. Live baseline performance was home 49, category 92, brand 53 and product 77. Final local preview performance was home 62, category 80, brand 83 and product 80. The next deployment must collect like-for-like production measurements.

# 5. Remaining P0 Issues

- The production deployment has not yet been redeployed with this output. Until it is, live routes still have the original raw HTML and soft-404 behavior.
- Confirm the Vercel production environment uses the corrected public API setting before deployment.

# 6. Remaining P1 Issues

- Verify deployed unknown URLs return HTTP 404 and legacy routes redirect in one hop; Vite preview cannot emulate Vercel routing exactly.
- Submit the new sitemap and inspect representative URLs in Google Search Console after deployment.
- Repair the 36 active API records not generated because they lacked a usable canonical name, brand or URL after normalization.
- Existing `npx tsc -b` and `npm run lint` fail on pre-existing application errors. The full command outputs identify the affected files.

# 7. External Data Still Needed

- Google Search Console access and URL Inspection.
- GA4 data/configuration if GA4 is required alongside Vercel Analytics.
- SEMrush or equivalent rank-tracking project.
- PageSpeed Insights/CrUX production field data.
- Confirmation that contact details, authorised-dealer wording and business hours are current before any future expansion of LocalBusiness data.

# 8. Next SEO Task

Production validation is complete for the technical release; do not create a Preview solely for this work. Next, obtain Google Search Console access, submit the 1,936-URL sitemap, and use real historical/search data to prioritise content work. Keep the existing non-SEO TypeScript errors as a separate P1 cleanup before making type checking a required release gate.
