import { useCallback } from 'react';

// Cookie-less analytics using localStorage aggregation
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
    const data = getAnalyticsData();
    data.pageViews[page] = (data.pageViews[page] || 0) + 1;
    saveAnalyticsData(data);
  }, []);

  const trackProductView = useCallback((productId: string) => {
    const data = getAnalyticsData();
    data.productViews[productId] = (data.productViews[productId] || 0) + 1;
    saveAnalyticsData(data);
  }, []);

  const trackSearch = useCallback((query: string) => {
    const data = getAnalyticsData();
    data.searchQueries = [query, ...data.searchQueries.slice(0, 99)];
    saveAnalyticsData(data);
  }, []);

  const trackWhatsAppClick = useCallback(() => {
    const data = getAnalyticsData();
    data.whatsappClicks += 1;
    saveAnalyticsData(data);
  }, []);

  const trackCategoryView = useCallback((category: string) => {
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
