import { createContext, useContext } from 'react';
import type { SEOMetadata } from '@/lib/seo';

export interface SEOCollector {
  set: (metadata: SEOMetadata) => void;
}

const SEOCollectorContext = createContext<SEOCollector | null>(null);

export const SEOCollectorProvider = SEOCollectorContext.Provider;

export function useSEOCollector() {
  return useContext(SEOCollectorContext);
}
