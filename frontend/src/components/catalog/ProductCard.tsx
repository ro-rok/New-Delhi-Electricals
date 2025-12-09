import { Link } from 'react-router-dom';
import { Heart, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { cn, getProductUrl } from '@/lib/utils';
import { useMagneticEffect } from '@/hooks/useMagneticEffect';
import { LazyImage } from '@/components/ui/LazyImage';

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'default' | 'compact';
}

const badgeConfig = {
  popular: { label: 'Popular', className: 'bg-foreground/5 text-foreground border-0' },
  'best-value': { label: 'Best Value', className: 'bg-foreground/5 text-foreground border-0' },
  new: { label: 'New', className: 'bg-foreground/5 text-foreground border-0' },
};

const ProductCard = ({ product, index = 0, variant = 'default' }: ProductCardProps) => {
  const { toggleShortlist, isInShortlist, toggleComparison, isInComparison } = useApp();
  const heartBtnRef = useMagneticEffect(0.25);
  const compareBtnRef = useMagneticEffect(0.25);

  const handleShortlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleShortlist(product.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleComparison(product.id);
  };

  const inShortlist = isInShortlist(product.id);
  const inComparison = isInComparison(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
    >
      <Link to={getProductUrl(product)} className="block group">
        <div className="relative bg-background rounded-3xl border border-border/50 overflow-hidden transition-all duration-500 hover:shadow-md hover:-translate-y-2 hover:border-foreground/10">
          {/* Image */}
          <div className="relative aspect-square bg-secondary/20 overflow-hidden">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <LazyImage
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-contain"
                placeholder={product.images[0]}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground/20 text-6xl font-light">
                  {product.brand.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Badge */}
            {product.badge && (
              <Badge className={cn('absolute top-4 left-4 z-10 text-[10px] font-medium px-2.5 py-1', badgeConfig[product.badge].className)}>
                {badgeConfig[product.badge].label}
              </Badge>
            )}

            {/* Quick Actions */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                ref={heartBtnRef as any}
                variant="secondary"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full shadow-sm bg-background/80 backdrop-blur-xl hover:bg-background transition-all duration-200',
                  inShortlist && 'text-red-500'
                )}
                onClick={handleShortlist}
              >
                <Heart className={cn('h-4 w-4', inShortlist && 'fill-current')} strokeWidth={1.5} />
              </Button>
              <Button
                ref={compareBtnRef as any}
                variant="secondary"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full shadow-sm bg-background/80 backdrop-blur-xl hover:bg-background transition-all duration-200',
                  inComparison && 'text-accent'
                )}
                onClick={handleCompare}
              >
                <GitCompare className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium tracking-wide">
              {product.brand} · {product.product_family}
            </p>
            <h3 className="font-medium text-base mb-3 line-clamp-2 leading-snug tracking-tight">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="font-semibold text-lg tracking-tight">
                ₹{product.listPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
