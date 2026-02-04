import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import BrandHero from '@/components/brand/BrandHero';
import FeaturedCollection from '@/components/brand/FeaturedCollection';
import ProductSection from '@/components/brand/ProductSection';
import CatalogModal from '@/components/brand/CatalogModal';
import WhatsAppCTA from '@/components/brand/WhatsAppCTA';
import { getBrands, getProductsByBrand, getCategories } from '@/api/products';
import { Brand, Product, Category } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { SEOHead } from '@/components/SEOHead';
import { getBrandSEO } from '@/lib/seo';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const BrandPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { trackPageView } = useApp();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state immediately when route params change
    setBrand(null);
    setBrandProducts([]);
    setLoading(true);

    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const [brandsList, catsList] = await Promise.all([
          getBrands(),
          getCategories(),
        ]);
        const foundBrand = brandsList.find(b => b.slug === slug);
        setBrand(foundBrand || null);
        setBrands(brandsList);
        setCategories(catsList);
        if (foundBrand) {
          // Use backend filtering for better performance
          const products = await getProductsByBrand(foundBrand.name);
          setBrandProducts(products);
        }
      } catch (error) {
                setBrand(null);
        setBrandProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, location.key]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading brand..." />
          </div>
        </main>
      </div>
    );
  }

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
      <SEOHead {...getBrandSEO(brand.name, brandProducts.length)} />
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

        {/* All Brands Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-border/30 py-20 bg-gray-50 dark:bg-gray-950"
        >
          <div className="container mx-auto px-6 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-foreground mb-2">
                All Brands
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore our complete range of trusted brands
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {brands.map((b, idx) => {
                const isActive = brand?.slug === b.slug;
                
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      to={`/brand/${b.slug}`}
                      className={`block group relative bg-white dark:bg-black rounded-2xl p-8 border transition-all duration-300 ${
                        isActive
                          ? 'border-gray-900 dark:border-white shadow-lg'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-xl'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                        isActive
                          ? 'bg-gray-900 dark:bg-white'
                          : 'bg-gray-100 dark:bg-gray-900 group-hover:bg-gray-200 dark:group-hover:bg-gray-800'
                      }`}>
                        <span className={`text-2xl font-light transition-colors ${
                          isActive
                            ? 'text-white dark:text-black'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {b.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className={`text-lg font-medium mb-2 transition-colors ${
                        isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400'
                      }`}>
                        {b.name}
                      </h3>
                      {b.featured && (
                        <span className="inline-block text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full mb-2">
                          Authorized Partner
                        </span>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {b.productCount || 0} {(b.productCount || 0) === 1 ? 'product' : 'products'}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

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
