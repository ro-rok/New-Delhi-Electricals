/**
 * Lightweight analytics tracking — fires events to the backend
 * which stores them in MongoDB for the admin dashboard.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

interface TrackingEvent {
  type: 'page_view' | 'product_view' | 'whatsapp_click' | 'search';
  path?: string;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  query?: string;
}

// Fire-and-forget — never blocks UI or shows errors to users
export function trackEvent(event: TrackingEvent): void {
  try {
    navigator.sendBeacon?.(
      `${API_BASE}/api/tracking/event`,
      new Blob([JSON.stringify({ ...event, path: event.path || window.location.pathname })], {
        type: 'application/json',
      })
    );
  } catch {
    // Fallback to fetch if sendBeacon not available
    fetch(`${API_BASE}/api/tracking/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, path: event.path || window.location.pathname }),
      keepalive: true,
    }).catch(() => {}); // silently ignore
  }
}

export function trackPageView(path?: string): void {
  trackEvent({ type: 'page_view', path: path || window.location.pathname });
}

export function trackProductView(productId: string, productName: string, brand?: string, category?: string): void {
  trackEvent({ type: 'product_view', productId, productName, brand, category });
}

export function trackWhatsAppClick(productId?: string, productName?: string): void {
  trackEvent({ type: 'whatsapp_click', productId, productName });
}

export function trackSearch(_query: string): void {
  trackEvent({ type: 'search' });
}

// Summary data type for admin dashboard
export interface TrackingSummary {
  pageViews: number;
  productViews: number;
  whatsappClicks: number;
  searches: number;
  topProducts: { productId: string; name: string; views: number }[];
  topPages: { path: string; views: number }[];
  daily: { date: string; pageViews: number; productViews: number; whatsappClicks: number }[];
  period: { start: string; end: string };
}

export async function getTrackingSummary(range: string = '7d'): Promise<TrackingSummary> {
  const res = await fetch(`${API_BASE}/api/tracking/summary?range=${range}`);
  if (!res.ok) {
    return { pageViews: 0, productViews: 0, whatsappClicks: 0, searches: 0, topProducts: [], topPages: [], daily: [], period: { start: '', end: '' } };
  }
  return res.json();
}
