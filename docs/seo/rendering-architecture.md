# Rendering Architecture

Canonical public routes are generated from the production catalogue API with genuine React 18 server rendering.

- frontend/src/entry-server.tsx uses react-dom/server with React Router StaticRouter.
- AppContent is the shared route table. The browser wraps it in BrowserRouter; the build renderer wraps it in StaticRouter.
- PrerenderRoute is the server-compatible, deterministic initial route component for generated public documents. The browser hydrates this same component with the exact embedded route data; it is not a crawler-only shell and is not discarded after hydration.
- This is not a full SSR conversion of every legacy page component. The architecture is a deterministic, materially equivalent initial React tree plus a hydrated interactive client application. Header navigation, mobile navigation, product enquiry links, cart additions and known catalogue variant links are usable on that initial hydrated tree. After a client-side route change, the initial payload is deliberately ignored and the existing interactive route component runs for the new URL.
- The embedded product action uses the current product's SKU/name in its WhatsApp handoff and stores the current product in the local quotation cart. Variant links point to their generated product documents, preserving selected-SKU URL state and the same initial interaction contract.
- The generator injects rendered React markup into root; no handcrafted crawler shell is used.
- Each document embeds only its current route data in window.__NDE_INITIAL_ROUTE_DATA__. It escapes HTML-significant characters and U+2028/U+2029 before insertion.
- main.tsx uses hydrateRoot only when that matching payload and prerendered root exist.

There is no crawler-only hidden content: the H1, breadcrumbs, visible catalogue/product identity, primary description, product links and JSON-LD are sourced from the same route data before and after hydration. The browser suite compares server and hydrated H1, title, canonical, breadcrumb and visible route identity for home, category, brand, Havells product and Finolex product routes; it also observes no hydration mismatch, root replacement or uncaught page errors. CLS is measured with `PerformanceObserver` across load, hydration and initial settling, excluding entries with recent user input.

Metadata and JSON-LD come from getRouteMetadata in frontend/src/lib/routeData.ts, the same model used by the server renderer and hydrated route. Product schema intentionally has no Offer, availability, ratings, reviews, GTIN or MPN.

The build fails if the production API cannot be loaded. A repository catalogue fallback is possible only with SEO_ALLOW_CATALOG_FALLBACK=true; the report then records the API failure, fallback count, file timestamp and SHA-256.
