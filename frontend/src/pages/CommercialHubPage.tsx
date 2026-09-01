import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import NotFound from '@/pages/NotFound';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CommercialHubView } from '@/components/commercial/CommercialHubView';
import { SEOHead } from '@/components/SEOHead';
import { getProductsByBrand } from '@/api/products';
import { findHub, selectHubProducts } from '@/lib/commercialHubs';
import { getHubSEO } from '@/lib/seo';
import { useApp } from '@/contexts/AppContext';
import { useInitialRouteData } from '@/lib/initialRouteData';
import type { Product } from '@/types/product';

/** Deterministic order so the prerendered list and the client fetch hydrate byte-stable. */
function orderedHubProducts(hub: ReturnType<typeof findHub>, items: Product[]): Product[] {
  if (!hub) return [];
  return selectHubProducts(hub, items).slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Client route for a brand x category commercial hub. The prerendered document renders the
 * same body for the first paint, so this only has to restore it after an in-app navigation.
 */
const CommercialHubPage = () => {
  const { slug, hub: hubSlug } = useParams();
  const location = useLocation();
  const { trackPageView } = useApp();
  const hub = findHub(slug, hubSlug);
  const initialData = useInitialRouteData();
  const hasInitialData = Boolean(hub)
    && initialData?.pathname === location.pathname
    && Array.isArray(initialData?.products);
  const [products, setProducts] = useState<Product[]>(() => hasInitialData ? initialData?.products ?? [] : []);
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (!hub) return;
    let cancelled = false;
    if (!hasInitialData) setLoading(true);
    getProductsByBrand(hub.brandName)
      .then(items => { if (!cancelled) setProducts(orderedHubProducts(hub, items)); })
      .catch(() => { if (!cancelled && !hasInitialData) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hub, hasInitialData]);

  useEffect(() => {
    if (hub) trackPageView(`hub-${hub.brandSlug}-${hub.slug}`);
  }, [hub, trackPageView]);

  if (!hub) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...getHubSEO(hub, products)} />
      <Header />
      <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        {loading && !products.length
          ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" text={`Loading ${hub.brandName} range...`} /></div>
          : <CommercialHubView hub={hub} products={products} />}
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CommercialHubPage;
