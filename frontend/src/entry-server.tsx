import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppContent, AppProviders } from './App';
import { getRouteMetadata, type RouteData } from './lib/routeData';

export function render(url: string, routeData: RouteData) {
  const html = renderToString(<AppProviders prerender><StaticRouter location={url}><AppContent initialRouteData={routeData} /></StaticRouter></AppProviders>);
  return { html, metadata: getRouteMetadata(routeData) };
}
