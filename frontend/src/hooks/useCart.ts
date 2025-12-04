import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = 'nde_cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      let updated: CartItem[];
      
      if (existingIndex >= 0) {
        // Update quantity if product already in cart
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        // Add new product to cart
        updated = [...prev, { product, quantity }];
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => {
      const updated = prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [removeFromCart]);

  const isInCart = useCallback((productId: string) => {
    return cart.some(item => item.product.id === productId);
  }, [cart]);

  const clearCart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCart([]);
  }, []);

  const getCartItem = useCallback((productId: string) => {
    return cart.find(item => item.product.id === productId);
  }, [cart]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.listPrice * item.quantity), 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    isInCart,
    clearCart,
    getCartItem,
    cartCount: totalItems,
    totalPrice,
  };
};

