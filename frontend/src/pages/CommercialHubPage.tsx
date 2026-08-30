import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import NotFound from '@/pages/NotFound';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CommercialHubView } from '@/components/commercial/CommercialHubView';
import { SEOHead } from '@/components/SEOHead';
import { getProductsByBrand } from '@/api/products';
import { findHub, hubPath, selectHubProducts } from '@/lib/commercialHubs';
import { getRouteMetadata } from '@/lib/routeData';
import { useApp } from '@/contexts/AppContext';
import type { Product } from '@/types/product';

/**
 * Client route for a brand x category commercial hub. The prerendered document renders the
 * same body for the first paint, so this only has to restore it after an in-app navigation.
 */
const CommercialHubPage = () => {
  const { slug, hub: hubSlug } = useParams();
  const { trackPageView } = useApp();
  const hub = findHub(slug, hubSlug);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hub) return;
    let cancelled = false;
    setLoading(true);
    getProductsByBrand(hub.brandName)
      .then(items => { if (!cancelled) setProducts(selectHubProducts(hub, items)); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hub]);

  useEffect(() => {
    if (hub) trackPageView(`hub-${hub.brandSlug}-${hub.slug}`);
  }, [hub, trackPageView]);

  if (!hub) return <NotFound />;

  const metadata = getRouteMetadata({
    kind: 'hub', path: hubPath(hub), title: hub.title, description: hub.description,
    heading: hub.heading, hub: { brandSlug: hub.brandSlug, slug: hub.slug }, products,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={hub.title} description={hub.description} canonicalPath={hubPath(hub)}
        structuredData={metadata.schema}
      />
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
