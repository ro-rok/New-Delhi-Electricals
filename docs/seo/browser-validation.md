# Browser Validation Summary

## Routes Tested

- `/`
- `/category/switches-sockets`
- `/brand/havells`
- `/havells/2-channel-dimmer-2m-grey`
- `/finolex/finolex-fr-0-75-sqmm-300m-house-wire`

## Browser Environment

Playwright `1.62.1` with Chrome for Testing `151.0.7922.34` on Windows. The test server maps a clean URL directly to its generated `.html` file and returns 404 when absent. It does not emulate Vercel CDN caching, redirects, headers, or edge routing.

## JavaScript-Off Results

All five pages rendered a populated React `#root`, H1, canonical, title, description, and expected JSON-LD without JavaScript. No `.seo-static-shell` was found. Screenshots for JavaScript-off, immediate parse, and settled hydration are in `docs/seo/browser-validation/`.

## Hydration Results

All five routes retained the prerendered H1 node through hydration. The test suite fails on hydration mismatch/root-replacement messages; final result: **0 hydration mismatch warnings, 0 React root-replacement warnings, 0 SSR/hydration page errors**.

The client now consumes `window.__NDE_INITIAL_ROUTE_DATA__` through `InitialRouteDataProvider`, matching the server provider. Initial brand data is retained if background revalidation cannot supply its matching brand. Product variants are retained from the serialized route payload.

## DOM Persistence

`#root` remained populated, its selected H1 node survived hydration, and no legacy static shell or root clearing occurred on every tested route.

## Screenshot / Visual Parity

The JavaScript-off and immediate screenshots match, and the settled render keeps the same first-view H1 and primary content. No material flash or layout collapse was observed. Category API revalidation retains the same first-page product identities and uses a deterministic product-name tie-breaker so Node and Chromium do not reshuffle equal-name records.

## CLS / LCP

The browser suite collects CLS and asserts it is `<= 0.1` for each representative route; all passed. Local headless LCP is not reported as a production metric because it is not comparable with Vercel/CDN behaviour; collect LCP in the preview deployment.

## Metadata and Structured Data Parity

Every representative page retained exactly one title, meta description, and canonical. Raw and hydrated JSON-LD parsed to the same types: home `LocalBusiness`; category and brand `BreadcrumbList`; products `Product` and `BreadcrumbList`. No Offer, availability, InStock, aggregateRating, review, or priceValidUntil claims were added.

## Functional Smoke Tests

Passed: homepage-to-category navigation, category-to-product navigation, add to cart, product WhatsApp handoff (opened only; no message sent), back/forward, and mobile menu open/close. No live contact or quotation enquiry was submitted.

## Analytics Event Tests

The browser run validates CTA construction and the shared tracking wrapper remains in the interaction path, but local Vercel Analytics ingestion/event counts cannot be verified from this server. Preview verification must confirm the expected custom-event matrix and absence of duplicates; this is not evidence of Vercel ingestion.

## Network Behavior

Browser revalidation used the real production catalogue API with Playwright fulfilling responses with a local CORS header solely for the local-origin test server. Representative patterns were bounded: category requests are one brand request plus one request per mapped DB category, brand requests are brands/categories/brand-products, and prerendered product routes make no initial product/variant fetch. No route-wide catalogue fetch, request loop, or fallback-data request was observed.

## Build and Test Results

- `npm run build`: passed; production API; 1,972 indexable routes (1,954 products, 6 categories, 5 brands).
- `npm test`: passed; 1,972 generated routes, 0 failures, 0 warnings.
- `npm run test:browser`: passed; 7 Playwright tests.
- `git diff --check`: passed (line-ending warnings only).

## Preview Deployment

Unavailable from this checkout. No authenticated/project-linked Vercel preview deployment was created.

## Remaining Problems

No P0/P1 browser-rendering blockers found locally. Preview still needs to validate Vercel-specific clean URLs, redirects, headers, CDN behaviour, real CORS, actual analytics ingestion, and production-like CWV.
