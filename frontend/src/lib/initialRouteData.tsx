import { createContext, useContext } from 'react';
import type { Brand, Category, Product } from '@/types/product';

export interface InitialRouteData {
  pathname: string;
  products?: Product[];
  product?: Product | null;
  brands?: Brand[];
  categories?: Category[];
  categoryCounts?: Record<string, number>;
  similarProducts?: Product[];
  moduleVariants?: Product[];
  colorVariants?: Product[];
  variantProducts?: Record<string, Product>;
  home?: {
    featuredBrands: Brand[];
    featuredProducts: Record<string, Product[]>;
  };
}

declare global {
  interface Window {
    __NDE_INITIAL_ROUTE_DATA__?: InitialRouteData;
  }
}

const InitialRouteDataContext = createContext<InitialRouteData | null>(null);

export function readInitialRouteData(): InitialRouteData | null {
  return typeof window === 'undefined' ? null : window.__NDE_INITIAL_ROUTE_DATA__ ?? null;
}

export function InitialRouteDataProvider({ data, children }: { data?: InitialRouteData | null; children: React.ReactNode }) {
  return (
    <InitialRouteDataContext.Provider value={data ?? readInitialRouteData()}>
      {children}
    </InitialRouteDataContext.Provider>
  );
}

export function useInitialRouteData() {
  return useContext(InitialRouteDataContext);
}
