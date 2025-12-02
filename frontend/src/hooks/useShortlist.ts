import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nde_shortlist';

export const useShortlist = () => {
  const [shortlist, setShortlist] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setShortlist(JSON.parse(stored));
      } catch {
        setShortlist([]);
      }
    }
  }, []);

  const addToShortlist = useCallback((productId: string) => {
    setShortlist(prev => {
      if (prev.includes(productId)) return prev;
      const updated = [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromShortlist = useCallback((productId: string) => {
    setShortlist(prev => {
      const updated = prev.filter(id => id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleShortlist = useCallback((productId: string) => {
    setShortlist(prev => {
      const exists = prev.includes(productId);
      const updated = exists 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInShortlist = useCallback((productId: string) => {
    return shortlist.includes(productId);
  }, [shortlist]);

  const clearShortlist = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShortlist([]);
  }, []);

  return { 
    shortlist, 
    addToShortlist, 
    removeFromShortlist, 
    toggleShortlist,
    isInShortlist, 
    clearShortlist,
    shortlistCount: shortlist.length 
  };
};
