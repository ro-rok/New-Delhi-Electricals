import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { getProductBySlug, getProducts } from '@/api/products';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { 
  MessageCircle, Heart, GitCompare, Share2, ArrowLeft,
  ChevronLeft, ChevronRight, Download, FileText, Copy, Check, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getProductUrl } from '@/lib/utils';

const ProductSlugPage = () => {
  const { brand, product_family, slug } = useParams<{ brand: string; product_family: string; slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    addToRecentlyViewed, 
    trackProductView, 
    toggleShortlist, 
    isInShortlist, 
    toggleComparison, 
    isInComparison, 
    trackWhatsAppClick,
    addToCart,
    isInCart
  } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [imageError, setImageError] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  useEffect(() => {
    // Reset state immediately when route params change
    setProduct(null);
    setSimilarProducts([]);
    setImageError(false);
    setCurrentImageIndex(0);
    setLoading(true);

    const fetchProduct = async () => {
      if (!brand || !product_family || !slug) {
        setLoading(false);
        return;
      }
      try {
        const prod = await getProductBySlug(brand, product_family, slug);
        setProduct(prod);
        if (prod) {
          // Fetch similar products
          const response = await getProducts({ pageSize: 20 });
          const similar = response.items
            .filter(p => p.id !== prod.id && (p.category === prod.category || p.brand === prod.brand))
            .slice(0, 4);
          setSimilarProducts(similar);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [brand, product_family, slug, location.key]);

  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id);
      trackProductView(product.id);
    }
  }, [product, addToRecentlyViewed, trackProductView]);

  const productImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      // Filter out empty strings and ensure URLs are valid
      return product.images.filter(img => img && img.trim() !== '');
    }
    return [];
  }, [product]);

  const handleWhatsApp = () => {
    if (!product) return;
    trackWhatsAppClick();
    const message = encodeURIComponent(`Hi! I'm interested in SKU ${product.sku} - ${product.name}. Please share more details.`);
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  const handleShare = () => {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} - ${product.brand}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: 'Link copied to clipboard' });
    }
  };

  const copySku = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    toast({ description: 'SKU copied to clipboard' });
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const nextImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-light mb-4 text-gray-900 dark:text-white">Product not found</h1>
          <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const inShortlist = isInShortlist(product.id);
  const inComparison = isInComparison(product.id);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Minimal Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </motion.nav>

      <main className="pt-16">
        {/* Hero Image Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black overflow-hidden">
          <AnimatePresence mode="wait">
            {productImages.length > 0 && !imageError ? (
              <motion.img
                key={currentImageIndex}
                src={productImages[currentImageIndex]}
                alt={product.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="max-w-5xl w-full h-auto object-contain px-6"
                onError={() => {
                  setImageError(true);
                }}
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-[240px] md:text-[320px] font-extralight text-gray-200 dark:text-gray-800 leading-none">
                  {product.brand.charAt(0).toUpperCase()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Navigation */}
          {productImages.length > 1 && !imageError && (
            <>
              <motion.button
                onClick={prevImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all shadow-xl border border-gray-100 dark:border-gray-800"
              >
                <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
              </motion.button>
              <motion.button
                onClick={nextImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all shadow-xl border border-gray-100 dark:border-gray-800"
              >
                <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
              </motion.button>
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2.5">
                {productImages.map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === currentImageIndex
                        ? "bg-gray-900 dark:bg-white w-8"
                        : "bg-gray-300 dark:bg-gray-700 w-1.5"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Product Info Section */}
        <section className="max-w-4xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-[0.2em] font-light">
              {product.brand} {product.series && `· ${product.series}`}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight text-gray-900 dark:text-white mb-8 leading-[1.1] tracking-tight">
              {product.name}
            </h1>
            <p className="text-3xl md:text-4xl font-light text-gray-900 dark:text-white mb-10">
              ₹{product.listPrice.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={copySku}
                className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                {copiedSku ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>SKU: {product.sku}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-24"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                onClick={handleWhatsApp}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-7 text-base font-normal rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Enquire on WhatsApp
              </Button>
            </motion.div>
            {product && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => {
                    addToCart(product, 1);
                    toast({ description: 'Product added to cart' });
                  }}
                  variant="outline"
                  className={cn(
                    "px-10 py-7 text-base font-normal rounded-full border-2 transition-all",
                    isInCart(product.id) && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  )}
                >
                  <ShoppingCart className={cn(
                    "h-5 w-5 mr-2",
                    isInCart(product.id) && "fill-current"
                  )} />
                  {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
                </Button>
              </motion.div>
            )}
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleShortlist(product.id)}
                  className={cn(
                    "px-6 py-7 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all",
                    inShortlist && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  )}
                >
                  <Heart className={cn(
                    "h-5 w-5 transition-all",
                    inShortlist && "fill-current text-red-600 dark:text-red-400"
                  )} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleComparison(product.id)}
                  className={cn(
                    "px-6 py-7 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all",
                    inComparison && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                  )}
                >
                  <GitCompare className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Description */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-24"
            >
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed text-center max-w-3xl mx-auto font-light">
                {product.description}
              </p>
            </motion.div>
          )}

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="border-t border-gray-200 dark:border-gray-800 pt-24"
            >
              <h2 className="text-3xl md:text-4xl font-extralight text-gray-900 dark:text-white mb-16 text-center tracking-tight">
                Specifications
              </h2>
              <div className="space-y-px max-w-2xl mx-auto bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                {Object.entries(product.specs).map(([key, value], idx) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className={cn(
                      "flex items-center justify-between py-5 px-8",
                      idx % 2 === 0 
                        ? "bg-white dark:bg-black" 
                        : "bg-gray-50 dark:bg-gray-950"
                    )}
                  >
                    <span className="text-sm md:text-base text-gray-600 dark:text-gray-400 capitalize font-light">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\bMW\b/gi, 'Module Width')}
                    </span>
                    <span className="text-sm md:text-base text-gray-900 dark:text-white font-normal">
                      {String(value)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Downloads */}
          {product.datasheetUrl && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-24 text-center"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="rounded-full border border-gray-200 dark:border-gray-800 px-10 py-7 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                >
                  <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-5 w-5 mr-2" />
                    Download Datasheet
                    <Download className="h-5 w-5 ml-2" />
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-800 py-24 md:py-32 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl font-extralight text-gray-900 dark:text-white mb-16 text-center tracking-tight"
              >
                Similar Products
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {similarProducts.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                  >
                    <Link
                      to={getProductUrl(p)}
                      className="group block"
                    >
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-2xl transition-all duration-300"
                      >
                        <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center mb-5 overflow-hidden">
                          {p.images && p.images.length > 0 && p.images[0] ? (
                            <img 
                              src={p.images[0]} 
                              alt={p.name} 
                              className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <span className="text-5xl font-extralight text-gray-300 dark:text-gray-700">
                              {p.brand.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-normal text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm md:text-base">
                          {p.name}
                        </h3>
                        <p className="text-lg font-light text-gray-600 dark:text-gray-400">
                          ₹{p.listPrice.toLocaleString('en-IN')}
                        </p>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default ProductSlugPage;

