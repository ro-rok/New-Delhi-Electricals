import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppContent } from './App';
import { InitialRouteDataProvider, type InitialRouteData } from './lib/initialRouteData';
import { SEOCollectorProvider } from './lib/seoCollector';
import type { SEOMetadata } from './lib/seo';

// Re-exported so the SEO generator enumerates and fills commercial hub routes from the
// same definitions the browser bundle renders.
export { COMMERCIAL_HUBS, hubPath, selectHubProducts, orderHubProducts } from './lib/commercialHubs';
// Re-exported so the SEO generator prerenders exactly the guides the app publishes.
export { GUIDES } from './content/guides';

export function render(url: string, initialData: InitialRouteData) {
  let metadata: SEOMetadata | null = null;
  const appHtml = renderToString(
    <SEOCollectorProvider value={{ set: (value) => { metadata = value; } }}>
      <InitialRouteDataProvider data={initialData}>
        <StaticRouter location={url} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </StaticRouter>
      </InitialRouteDataProvider>
    </SEOCollectorProvider>,
  );
  return { appHtml, metadata };
}
