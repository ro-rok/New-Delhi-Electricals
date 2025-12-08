import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { getProductBySlug, getProducts } from '@/api/products';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
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
  const [moduleVariants, setModuleVariants] = useState<Product[]>([]);
  const [colorVariants, setColorVariants] = useState<Product[]>([]);

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

  useEffect(() => {
    const fetchVariants = async () => {
      if (!product) {
        setModuleVariants([]);
        setColorVariants([]);
        return;
      }

      try {
        const productFamily = product.catalogSource?.product_family || product.series;
        const currentColor = product.specs?.color as string | undefined;
        const currentModuleSize = product.specs?.module_size as string | undefined;

        console.log('Fetching variants for product:', {
          productFamily,
          currentColor,
          currentModuleSize,
          specs: product.specs,
          catalogSource: product.catalogSource
        });

        if (!productFamily) {
          console.log('No product_family found, skipping variant fetch');
          setModuleVariants([]);
          setColorVariants([]);
          return;
        }

        // Fetch module variants: same product_family and color, different module_size
        if (currentColor) {
          const moduleResponse = await getProducts({
            productFamily,
            color: currentColor,
            pageSize: 100,
          });
          console.log('Module variants response:', moduleResponse.items.length);
          const moduleVars = moduleResponse.items
            .filter(p => {
              const pModuleSize = p.specs?.module_size as string | undefined;
              const pColor = p.specs?.color as string | undefined;
              // If current product has no module_size, find products that DO have one
              // If current product has module_size, find products with different module_size
              if (currentModuleSize) {
                return p.id !== product.id && 
                       pModuleSize && 
                       pModuleSize !== currentModuleSize &&
                       pColor === currentColor;
              } else {
                return p.id !== product.id && 
                       pModuleSize && 
                       pColor === currentColor;
              }
            })
            .sort((a, b) => {
              const aSize = (a.specs?.module_size as string) || '';
              const bSize = (b.specs?.module_size as string) || '';
              return aSize.localeCompare(bSize);
            });
          console.log('Filtered module variants:', moduleVars.length);
          setModuleVariants(moduleVars);
        } else {
          console.log('No color found, skipping module variants');
          setModuleVariants([]);
        }

        // Fetch color variants: same product_family and module_size (if exists), different color
        // If no module_size, find products with same family and no module_size but different color
        if (currentColor) {
          const colorResponse = currentModuleSize
            ? await getProducts({
                productFamily,
                moduleSize: currentModuleSize,
                pageSize: 100,
              })
            : await getProducts({
                productFamily,
                pageSize: 100,
              });
          console.log('Color variants response:', colorResponse.items.length);
          const colorVars = colorResponse.items
            .filter(p => {
              const pColor = p.specs?.color as string | undefined;
              const pModuleSize = p.specs?.module_size as string | undefined;
              // Match module_size: both should be undefined or both should match
              const moduleSizeMatches = currentModuleSize 
                ? pModuleSize === currentModuleSize
                : !pModuleSize; // If current has no module_size, match products with no module_size
              
              return p.id !== product.id && 
                     pColor && 
                     pColor !== currentColor &&
                     moduleSizeMatches;
            })
            .sort((a, b) => {
              const aColor = (a.specs?.color as string) || '';
              const bColor = (b.specs?.color as string) || '';
              return aColor.localeCompare(bColor);
            });
          console.log('Filtered color variants:', colorVars.length);
          setColorVariants(colorVars);
        } else {
          console.log('No color found, skipping color variants');
          setColorVariants([]);
        }
      } catch (error) {
        console.error('Failed to fetch variants:', error);
        setModuleVariants([]);
        setColorVariants([]);
      }
    };

    fetchVariants();
  }, [product]);

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
      <Header />
      <div className="h-16" /> {/* Spacer for fixed header */}

      <main>
        {/* Hero Section with left image and right content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-12 lg:gap-16 items-center">
          <div className="relative min-h-[320px] md:min-h-[420px] lg:min-h-[500px] max-h-[560px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black rounded-3xl overflow-hidden flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-900 p-4 sm:p-6 md:p-8">
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
                  className="w-full h-full max-h-[420px] md:max-h-[500px] lg:max-h-[560px] object-contain"
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
                  <div className="text-[96px] md:text-[140px] font-extralight text-gray-200 dark:text-gray-800 leading-none">
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
                  className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all shadow-xl border border-gray-100 dark:border-gray-800"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
                </motion.button>
                <motion.button
                  onClick={nextImage}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all shadow-xl border border-gray-100 dark:border-gray-800"
                >
                  <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
                </motion.button>
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
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
          </div>

          <div className="space-y-6 w-full max-w-xl lg:max-w-2xl mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="space-y-4"
            >
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-light">
                {product.brand} {product.series && `· ${product.series}`}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                {product.name}
              </h1>
              <p className="text-3xl md:text-4xl font-light text-gray-900 dark:text-white">
                ₹{product.listPrice.toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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

            {/* Variant Selector */}
            {product && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800"
              >
                {/* Module Type Variants */}
                {moduleVariants.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Module Size:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
                        )}
                      >
                        {product.specs?.module_size || 'Current'}
                      </span>
                      {moduleVariants.map((variant) => (
                        <Link
                          key={variant.id}
                          to={getProductUrl(variant)}
                          className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white text-sm font-medium transition-all hover:border-gray-900 dark:hover:border-white hover:scale-105"
                        >
                          {variant.specs?.module_size || 'N/A'}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : product.specs?.module_size && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No other module sizes available
                  </div>
                )}

                {/* Color Variants */}
                {colorVariants.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Color:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
                        )}
                      >
                        {product.specs?.color || 'Current'}
                      </span>
                      {colorVariants.map((variant) => (
                        <Link
                          key={variant.id}
                          to={getProductUrl(variant)}
                          className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white text-sm font-medium transition-all hover:border-gray-900 dark:hover:border-white hover:scale-105"
                        >
                          {variant.specs?.color || 'N/A'}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : product.specs?.color && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No other colors available
                  </div>
                )}

                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-400 pt-2 space-y-1">
                    <div>Product Family: {product.catalogSource?.product_family || product.series || 'N/A'}</div>
                    <div>Current Color: {product.specs?.color || 'N/A'}</div>
                    <div>Current Module Size: {product.specs?.module_size || 'N/A'}</div>
                    <div>Module Variants Found: {moduleVariants.length}</div>
                    <div>Color Variants Found: {colorVariants.length}</div>
                  </div>
                )}
              </motion.div>
            )}

            {product.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-light"
              >
                {product.description}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 items-stretch sm:items-center"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={handleWhatsApp}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-10 py-6 text-base font-normal rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
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
                      "px-8 md:px-10 py-6 text-base font-normal rounded-full border-2 transition-all w-full sm:w-auto",
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
                      "px-5 md:px-6 py-6 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all",
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
                      "px-5 md:px-6 py-6 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all",
                      inComparison && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                    )}
                  >
                    <GitCompare className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

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
                        className="bg-white dark:bg-black rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                          {p.images && p.images.length > 0 && p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-4xl font-extralight text-gray-300 dark:text-gray-700">
                              {p.brand.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-normal text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
                          {p.name}
                        </h3>
                        <p className="text-base font-light text-gray-600 dark:text-gray-400">
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

