import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { cn, getProductUrl } from '@/lib/utils';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';
import { LazyImage } from '@/components/ui/LazyImage';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'default' | 'compact';
}

const badgeConfig = {
  popular: { label: 'Popular', className: 'bg-accent/10 text-accent border-accent/20' },
  'best-value': { label: 'Best Value', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  new: { label: 'New', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
};

const ProductCard = ({ product, index = 0, variant = 'default' }: ProductCardProps) => {
  const { toggleShortlist, isInShortlist } = useApp();
  const heartBtnRef = useMagneticEffect(0.25);

  const handleShortlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleShortlist(product.id);
  };

  const inShortlist = isInShortlist(product.id);

  const calculateFinalPrice = () => {
    if (product.discount && product.discount > 0) {
      const discountedPrice = product.listPrice * (1 - product.discount / 100);
      const priceWithGST = discountedPrice * 1.18;
      return Math.ceil(priceWithGST);
    }
    return Math.ceil(product.listPrice * 1.18);
  };

  const hasDiscount = product.discount && product.discount > 0;
  const finalPrice = calculateFinalPrice();

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = encodeURIComponent(`Hi, I'm interested in:\n\n*${product.name}*\nSKU: ${product.sku}\nBrand: ${product.brand}\nPrice: ₹${finalPrice.toLocaleString()} (incl. 18% GST)\n\nPlease share availability and best price.`);
    window.open(`https://wa.me/919654102758?text=${msg}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link to={getProductUrl(product)} className="block group">
        <div className="relative bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-accent/20">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-b from-secondary/30 to-secondary/10 overflow-hidden">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <LazyImage
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                placeholder={product.images[0]}
              />
            ) : (
              <ProductImagePlaceholder className="w-full h-full" />
            )}
            
            {/* Badge */}
            {product.badge && (
              <Badge className={cn('absolute top-3 left-3 z-10 text-[10px] font-semibold px-2 py-0.5 border', badgeConfig[product.badge].className)}>
                {badgeConfig[product.badge].label}
              </Badge>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                {product.discount}% OFF
              </div>
            )}

            {/* Quick Actions */}
            <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
              <Button
                ref={heartBtnRef as any}
                variant="secondary"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50 transition-all duration-200 touch-manipulation',
                  inShortlist && 'text-red-500 border-red-200'
                )}
                onClick={handleShortlist}
                aria-label={inShortlist ? 'Remove from shortlist' : 'Add to shortlist'}
              >
                <Heart className={cn('h-3.5 w-3.5', inShortlist && 'fill-current')} strokeWidth={2} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50 transition-all duration-200 touch-manipulation"
                onClick={handleWhatsApp}
                aria-label="Ask on WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </div>

            {/* Out of stock overlay */}
            {product.comingSoon && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="text-sm font-semibold text-muted-foreground bg-background/80 px-4 py-1.5 rounded-full border border-border">
                  Coming Soon
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[11px] font-medium text-accent">{product.brand}</span>
              {product.product_family && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[11px] text-muted-foreground">{product.product_family}</span>
                </>
              )}
            </div>
            <h3 className="font-medium text-sm mb-2.5 line-clamp-2 leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
              {product.name}
            </h3>
            <div className="space-y-0.5">
              {hasDiscount ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{product.listPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-base text-foreground">
                      ₹{finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">incl. 18% GST</p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-muted-foreground">From</span>
                    <span className="font-bold text-base text-foreground">
                      ₹{finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">incl. 18% GST</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
