import { useCallback } from 'react';
import { trackEvent as sendTrackEvent } from '@/api/tracking';

// Cookie-less analytics using localStorage aggregation + server-side tracking
const STORAGE_KEY = 'nde_analytics';

interface AnalyticsData {
  pageViews: Record<string, number>;
  productViews: Record<string, number>;
  searchQueries: string[];
  whatsappClicks: number;
  categoryViews: Record<string, number>;
  lastUpdated: string;
}

const getAnalyticsData = (): AnalyticsData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    pageViews: {},
    productViews: {},
    searchQueries: [],
    whatsappClicks: 0,
    categoryViews: {},
    lastUpdated: new Date().toISOString(),
  };
};

const saveAnalyticsData = (data: AnalyticsData) => {
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useAnalytics = () => {
  const trackPageView = useCallback((page: string) => {
    // Local storage
    const data = getAnalyticsData();
    data.pageViews[page] = (data.pageViews[page] || 0) + 1;
    saveAnalyticsData(data);
    // Server tracking
    sendTrackEvent({ type: 'page_view', path: page });
  }, []);

  const trackProductView = useCallback((productId: string, productName?: string, brand?: string, category?: string) => {
    // Local storage
    const data = getAnalyticsData();
    data.productViews[productId] = (data.productViews[productId] || 0) + 1;
    saveAnalyticsData(data);
    // Server tracking
    sendTrackEvent({ type: 'product_view', productId, productName, brand, category });
  }, []);

  const trackSearch = useCallback((query: string) => {
    // Local storage
    const data = getAnalyticsData();
    // Keep a count locally only; search text is not analytics data.
    data.searchQueries = ['search', ...data.searchQueries.slice(0, 99)];
    saveAnalyticsData(data);
    // Server tracking
    sendTrackEvent({ type: 'search' });
  }, []);

  const trackWhatsAppClick = useCallback((productId?: string, productName?: string) => {
    // Local storage
    const data = getAnalyticsData();
    data.whatsappClicks += 1;
    saveAnalyticsData(data);
    // Server tracking
    sendTrackEvent({ type: 'whatsapp_click', productId, productName });
  }, []);

  const trackCategoryView = useCallback((category: string) => {
    // Local storage
    const data = getAnalyticsData();
    data.categoryViews[category] = (data.categoryViews[category] || 0) + 1;
    saveAnalyticsData(data);
  }, []);

  const getStats = useCallback(() => {
    return getAnalyticsData();
  }, []);

  return {
    trackPageView,
    trackProductView,
    trackSearch,
    trackWhatsAppClick,
    trackCategoryView,
    getStats,
  };
};

// Re-export tracking API for direct use outside of React components
export { trackEvent as sendTrackingEvent } from '@/api/tracking';
