import React, { createContext, useContext, ReactNode } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useShortlist } from '@/hooks/useShortlist';
import { useComparison } from '@/hooks/useComparison';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCart, CartItem } from '@/hooks/useCart';
import { Product } from '@/types/product';

interface AppContextType {
  recentlyViewed: string[];
  addToRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
  
  shortlist: string[];
  addToShortlist: (id: string) => void;
  removeFromShortlist: (id: string) => void;
  toggleShortlist: (id: string) => void;
  isInShortlist: (id: string) => boolean;
  shortlistCount: number;
  
  comparison: string[];
  addToComparison: (id: string) => boolean;
  removeFromComparison: (id: string) => void;
  toggleComparison: (id: string) => boolean;
  isInComparison: (id: string) => boolean;
  comparisonCount: number;
  canAddMore: boolean;
  clearComparison: () => void;
  maxItems: number;
  
  trackPageView: (page: string) => void;
  trackProductView: (id: string) => void;
  trackSearch: (query: string) => void;
  trackWhatsAppClick: () => void;
  trackCategoryView: (category: string) => void;
  
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  isInCart: (productId: string) => boolean;
  clearCart: () => void;
  getCartItem: (productId: string) => CartItem | undefined;
  cartCount: number;
  totalPrice: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const { shortlist, addToShortlist, removeFromShortlist, toggleShortlist, isInShortlist, shortlistCount, clearShortlist } = useShortlist();
  const { comparison, addToComparison, removeFromComparison, toggleComparison, isInComparison, comparisonCount, canAddMore, clearComparison, maxItems } = useComparison();
  const { trackPageView, trackProductView, trackSearch, trackWhatsAppClick, trackCategoryView } = useAnalytics();
  const { cart, addToCart, removeFromCart, updateQuantity, isInCart, clearCart, getCartItem, cartCount, totalPrice } = useCart();

  return (
    <AppContext.Provider value={{
      recentlyViewed,
      addToRecentlyViewed,
      clearRecentlyViewed,
      shortlist,
      addToShortlist,
      removeFromShortlist,
      toggleShortlist,
      isInShortlist,
      shortlistCount,
      comparison,
      addToComparison,
      removeFromComparison,
      toggleComparison,
      isInComparison,
      comparisonCount,
      canAddMore,
      clearComparison,
      maxItems,
      trackPageView,
      trackProductView,
      trackSearch,
      trackWhatsAppClick,
      trackCategoryView,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      isInCart,
      clearCart,
      getCartItem,
      cartCount,
      totalPrice,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
