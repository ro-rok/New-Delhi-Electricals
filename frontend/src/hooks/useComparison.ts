import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nde_comparison';
const MAX_ITEMS = 4;

export const useComparison = () => {
  const [comparison, setComparison] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setComparison(JSON.parse(stored));
      } catch {
        setComparison([]);
      }
    }
  }, []);

  const addToComparison = useCallback((productId: string): boolean => {
    let added = false;
    setComparison(prev => {
      if (prev.includes(productId) || prev.length >= MAX_ITEMS) return prev;
      const updated = [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      added = true;
      return updated;
    });
    return added;
  }, []);

  const removeFromComparison = useCallback((productId: string) => {
    setComparison(prev => {
      const updated = prev.filter(id => id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleComparison = useCallback((productId: string): boolean => {
    let added = false;
    setComparison(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        const updated = prev.filter(id => id !== productId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      } else if (prev.length < MAX_ITEMS) {
        const updated = [...prev, productId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        added = true;
        return updated;
      }
      return prev;
    });
    return added;
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return comparison.includes(productId);
  }, [comparison]);

  const clearComparison = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setComparison([]);
  }, []);

  const canAddMore = comparison.length < MAX_ITEMS;

  return { 
    comparison, 
    addToComparison, 
    removeFromComparison, 
    toggleComparison,
    isInComparison, 
    clearComparison,
    comparisonCount: comparison.length,
    canAddMore,
    maxItems: MAX_ITEMS
  };
};
