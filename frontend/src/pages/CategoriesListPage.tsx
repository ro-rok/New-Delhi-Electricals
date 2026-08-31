import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { useEffect, useState } from 'react';
import { getProducts } from '@/api/products';
import { Product } from '@/types/product';
import { motion } from 'framer-motion';
import { ChevronRight, ToggleRight, Shield, Cable, Box, LayoutGrid, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PAGE_SEO } from '@/lib/seo';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SHOPPING_CATEGORIES, ShoppingCategory } from '@/config/shoppingCategories';
import { useInitialRouteData } from '@/lib/initialRouteData';

const iconMap: Record<string, LucideIcon> = {
  'switches-sockets': ToggleRight,
  'plates': LayoutGrid,
  'circuit-protection': Shield,
  'wires-cables': Cable,
  'boxes': Box,
  'geysers': Thermometer,
};

const CategoriesListPage = () => {
  const initialData = useInitialRouteData();
  const hasInitialData = initialData?.pathname === '/categories' && Boolean(initialData.categoryCounts);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(() => hasInitialData ? initialData?.categoryCounts ?? {} : {});
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getProducts({ pageSize: 2000 });
        setProducts(response.items);
        setCategoryCounts({});
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hasInitialData]);

  const getCategoryCount = (cat: ShoppingCategory) => {
    return categoryCounts[cat.slug] ?? products.filter(p => cat.dbCategories.includes(p.category)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading categories..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...PAGE_SEO.categories} />
      <Header />
      <main className="pt-16 pb-16">
        {/* Hero Banner */}
        <div className="relative overflow-hidden mb-12" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="container max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400/80 mb-3 block">Product Catalog</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
                Build Your Complete<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Electrical Setup</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-xl">
                From switches to plates to protection — everything for your home or office.
              </p>
            </motion.div>

            {/* Step flow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mt-8 text-sm flex-wrap"
            >
              {SHOPPING_CATEGORIES.map((cat, idx) => (
                <span key={cat.id} className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
                    {cat.step}
                  </span>
                  <span className="text-white/70 font-medium hidden sm:inline">{cat.displayName}</span>
                  {idx < SHOPPING_CATEGORIES.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-white/30" />
                  )}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-4">
          {SHOPPING_CATEGORIES.map((category, idx) => {
            const IconComponent = iconMap[category.id] || ToggleRight;
            const count = getCategoryCount(category);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.06, duration: 0.4 }}
              >
                <Link to={`/category/${category.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-accent/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative w-full md:w-56 h-40 md:h-auto overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20 flex-shrink-0">
                        <img
                          src={category.image}
                          alt={category.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
                        <div className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          Step {category.step}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-200">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-accent transition-colors">
                              {category.displayName}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-2">
                              {category.tagline}
                            </p>

                            {/* Sub-section tags */}
                            {category.subSections.length > 1 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {category.subSections.filter(s => s.id !== 'all').slice(0, 4).map(sub => (
                                  <span key={sub.id} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                                    {sub.name}
                                  </span>
                                ))}
                                {category.subSections.length > 5 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                                    +{category.subSections.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold">{count} products</span>
                              <span className="text-sm text-accent font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Browse collection
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-6xl mx-auto px-4 md:px-6 mt-12 text-center"
        >
          <p className="text-muted-foreground mb-3">
            Not sure where to start?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
          >
            Contact us for expert advice
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CategoriesListPage;
