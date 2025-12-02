import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import BrandHero from '@/components/brand/BrandHero';
import FeaturedCollection from '@/components/brand/FeaturedCollection';
import ProductSection from '@/components/brand/ProductSection';
import CatalogModal from '@/components/brand/CatalogModal';
import WhatsAppCTA from '@/components/brand/WhatsAppCTA';
import { brands, getProductsByBrand, categories } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';

const BrandPage = () => {
  const { slug } = useParams();
  const { trackPageView } = useApp();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const brand = brands.find(b => b.slug === slug);
  const brandProducts = useMemo(() => 
    brand ? getProductsByBrand(brand.name) : [], 
    [brand]
  );

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, typeof brandProducts> = {};
    brandProducts.forEach(product => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    return groups;
  }, [brandProducts]);

  useEffect(() => {
    if (brand) {
      trackPageView(`brand-${brand.slug}`);
    }
  }, [brand, trackPageView]);

  useEffect(() => {
    // Close modal on ESC key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCatalogOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground mb-4">Brand not found</p>
            <Link to="/brands" className="text-accent hover:underline text-sm">
              View all brands
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero with WhatsApp focus */}
        <BrandHero 
          brand={brand} 
          onCatalogOpen={brand.catalogUrl ? () => setIsCatalogOpen(true) : undefined}
        />

        {/* Featured Collection Section - NEW */}
        <FeaturedCollection brandName={brand.name} />
        
        {/* Brand Description - minimal and clean */}
        <div className="container mx-auto px-6 lg:px-16 py-16 border-t border-border/30">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-light text-foreground">About {brand.name}</h3>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              {brand.description}
            </p>
          </div>
        </div>

        {/* Product sections by category */}
        {Object.entries(productsByCategory).length > 0 ? (
          <div className="border-t border-border/30">
            {Object.entries(productsByCategory).map(([categoryName, categoryProducts], idx) => {
              // Find category slug for "View all" link
              const category = categories.find(c => c.name === categoryName);
              
              return (
                <ProductSection
                  key={categoryName}
                  title={categoryName}
                  products={categoryProducts.slice(0, 10)}
                  categorySlug={category?.slug}
                  index={idx}
                />
              );
            })}
          </div>
        ) : (
          <section className="py-24">
            <div className="container text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto"
              >
                <p className="text-muted-foreground mb-4">
                  No products available for this brand yet
                </p>
                <Link 
                  to="/categories" 
                  className="text-sm text-accent hover:underline"
                >
                  Explore other categories
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* WhatsApp CTA Strip */}
        <WhatsAppCTA brandName={brand.name} />
      </main>

      <Footer />
      <WhatsAppFab />

      {/* Catalog Modal */}
      {brand.catalogUrl && (
        <CatalogModal
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          catalogUrl={brand.catalogUrl}
          brandName={brand.name}
        />
      )}
    </div>
  );
};

export default BrandPage;
