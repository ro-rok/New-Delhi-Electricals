import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { useParams, Link, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ProductCard from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProductById, getProducts } from '@/api/products';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Heart, GitCompare, Copy, Check, FileText, 
  Camera, ChevronLeft, ChevronRight, ZoomIn, Download, Share2, ShoppingCart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

const badgeConfig = {
  popular: { label: 'Most Popular', className: 'bg-accent text-accent-foreground' },
  'best-value': { label: 'Best Value', className: 'bg-emerald-500 text-white' },
  new: { label: 'New Arrival', className: 'bg-violet-500 text-white' },
};

// Generate placeholder images for demo
const generatePlaceholderImages = (count: number, brandChar: string) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    url: '',
    alt: `Product view ${i + 1}`,
    brandChar,
  }));
};

const ProductPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { addToRecentlyViewed, trackProductView, toggleShortlist, isInShortlist, toggleComparison, isInComparison, trackWhatsAppClick, addToCart, isInCart } = useApp();
  const [copiedSku, setCopiedSku] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Reset state immediately when route params change
    setProduct(null);
    setSimilarProducts([]);
    setCurrentImageIndex(0);
    setLoading(true);

    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const prod = await getProductById(id);
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
  }, [id, location.key]);
  
  // Generate multiple images for carousel demo
  const productImages = useMemo(() => {
    if (!product) return [];
    return generatePlaceholderImages(4, product.brand.charAt(0));
  }, [product]);


  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id);
      trackProductView(product.id);
    }
  }, [product, addToRecentlyViewed, trackProductView]);

  const handleWhatsApp = () => {
    if (!product) return;
    trackWhatsAppClick();
    const message = encodeURIComponent(`Hi! I'm interested in SKU ${product.sku} - ${product.name}. Sharing my product list shortly.`);
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  const handlePhotoInquiry = () => {
    trackWhatsAppClick();
    const message = encodeURIComponent("Hi! I'm sharing my order sheet/photo. Please match products and send a quote.");
    window.open(`https://wa.me/919654102758?text=${message}`, '_blank');
  };

  const copySku = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    toast({ description: 'SKU copied to clipboard' });
    setTimeout(() => setCopiedSku(false), 2000);
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container">
          <p className="text-center text-muted-foreground">Product not found</p>
        </main>
      </div>
    );
  }

  const inShortlist = isInShortlist(product.id);
  const inComparison = isInComparison(product.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-foreground">{product.category}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-secondary/50 rounded-3xl flex items-center justify-center overflow-hidden group">
                {product.badge && (
                  <Badge className={cn('absolute top-4 left-4 z-10', badgeConfig[product.badge].className)}>
                    {badgeConfig[product.badge].label}
                  </Badge>
                )}
                
                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Zoom Button */}
                <Dialog open={showZoom} onOpenChange={setShowZoom}>
                  <DialogTrigger asChild>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background">
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="aspect-square bg-secondary rounded-2xl flex items-center justify-center">
                      <span className="text-[200px] font-bold text-muted-foreground/20">
                        {product.brand.charAt(0)}
                      </span>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Current Image */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <span className="text-8xl font-bold text-muted-foreground/20">
                      {product.brand.charAt(0)}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnail Strip */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {productImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        'w-20 h-20 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 transition-all',
                        idx === currentImageIndex
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'opacity-60 hover:opacity-100'
                      )}
                    >
                      <span className="text-2xl font-bold text-muted-foreground/40">
                        {img.brandChar}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  <Link to={`/brand/${product.brand.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-foreground">
                    {product.brand}
                  </Link>
                  {' · '}
                  {product.series}
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold mb-4">{product.name}</h1>
                
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={copySku}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedSku ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    SKU: {product.sku}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>

                <p className="text-3xl font-semibold mb-6">
                  ₹{product.listPrice.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">List Price</span>
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-8">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-5 w-5" />
                  Enquire on WhatsApp
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className={cn(
                    "w-full gap-2",
                    isInCart(product.id) && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  )}
                  onClick={() => {
                    addToCart(product, 1);
                    toast({ description: 'Product added to cart' });
                  }}
                >
                  <ShoppingCart className={cn(
                    "h-5 w-5",
                    isInCart(product.id) && "fill-current"
                  )} />
                  {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handlePhotoInquiry}
                >
                  <Camera className="h-5 w-5" />
                  Upload Order Photo
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className={cn('flex-1 gap-2', inShortlist && 'bg-red-50 text-red-600 dark:bg-red-950')}
                    onClick={() => toggleShortlist(product.id)}
                  >
                    <Heart className={cn('h-4 w-4', inShortlist && 'fill-current')} />
                    {inShortlist ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="secondary"
                    className={cn('flex-1 gap-2', inComparison && 'bg-accent/10 text-accent')}
                    onClick={() => toggleComparison(product.id)}
                  >
                    <GitCompare className="h-4 w-4" />
                    {inComparison ? 'In Compare' : 'Compare'}
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="specs" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="downloads">Downloads</TabsTrigger>
                </TabsList>
                <TabsContent value="specs" className="mt-4">
                  <div className="rounded-2xl border border-border overflow-hidden">
                    {Object.entries(product.specs).map(([key, value], idx) => (
                      <div
                        key={key}
                        className={cn(
                          'flex items-center justify-between py-3 px-4 hover:bg-secondary/50 transition-colors',
                          idx !== Object.entries(product.specs).length - 1 && 'border-b border-border'
                        )}
                      >
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ').replace(/\bMW\b/gi, 'Module Width')}
                        </span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="description" className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                  
                  {/* Catalog Source Info */}
                  {product.catalogSource && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
                      <p className="text-xs text-muted-foreground">
                        Source: {product.catalogSource.file} (Page {product.catalogSource.page})
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="downloads" className="mt-4 space-y-3">
                  {product.datasheetUrl && (
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                        Technical Datasheet
                        <Download className="h-4 w-4 ml-auto" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start gap-3" disabled={!product.datasheetUrl}>
                    <FileText className="h-4 w-4" />
                    Installation Guide
                    <Download className="h-4 w-4 ml-auto" />
                  </Button>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="text-2xl font-semibold mb-6">Similar Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} index={idx} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default ProductPage;