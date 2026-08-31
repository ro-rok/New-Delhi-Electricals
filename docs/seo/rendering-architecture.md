# React prerendering architecture

## Decision

The catalogue uses native Vite SSR at build time. `frontend/src/entry-server.tsx` renders the production React component tree with React Router's `StaticRouter`; `frontend/src/main.tsx` uses `hydrateRoot` whenever the delivered `#root` already contains React markup.

The prior handcrafted `.seo-static-shell` was removed. The generator imports the Vite SSR bundle, passes route-specific catalogue state, and writes that rendered HTML into each clean-URL document.

## Route and data flow

`AppContent` owns the single route table. The browser entry wraps it in `BrowserRouter`; the server entry wraps the same component in `StaticRouter`. The generator makes one production catalogue request plus two small taxonomy requests, selects only data required for the route, serializes it as `window.__NDE_INITIAL_ROUTE_DATA__`, and the corresponding page consumes it as its first state.

Category documents contain the first visible product page and silently revalidate after hydration. Brand documents contain the first visible products per category. Product documents contain the product, related cards, and bounded variant data. Category index documents contain counts rather than the whole catalogue. JSON is escaped for `<`, `>`, `&`, U+2028 and U+2029 before embedding.

## Alternatives considered

- A handcrafted SEO shell was rejected because it creates crawler/user divergence and is removed by `createRoot`.
- A browser-DOM serialization solution was rejected because it would still not hydrate a compatible React tree.
- A framework migration was rejected: native Vite SSR keeps the existing React 18, React Router, API and Vercel static-output model.

## Validation

`npm run build` must use the production API and fails if it cannot (unless the explicit review-only `SEO_ALLOW_CATALOG_FALLBACK=true` override is supplied). `npm test` validates every sitemap route, metadata, H1, schema claims, initial-data payload, React root and absence of the retired shell.
