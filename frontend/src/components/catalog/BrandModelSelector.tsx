import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Check, ArrowRight } from 'lucide-react';
import type { Product } from '@/types/product';

interface BrandModelSelectorProps {
  allProducts: Product[];
  selectedBrands: string[];
  selectedSeries: string[];
  onBrandToggle: (brand: string) => void;
  onSeriesToggle: (series: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Brand color map — each brand gets a unique accent color for visual identity.
 * Falls back to a computed hue from the brand name.
 */
const BRAND_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  'Anchor':           { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: '#3b82f6' },
  'Havells':          { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', accent: '#ef4444' },
  'Lauritz Knudsen':  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: '#10b981' },
  'Polycab':          { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: '#f59e0b' },
  'Finolex':          { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', accent: '#8b5cf6' },
  'Syska':            { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: '#06b6d4' },
  'Legrand':          { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: '#f97316' },
  'Schneider':        { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', accent: '#22c55e' },
  'V-Guard':          { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', accent: '#6366f1' },
  'Crompton':         { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', accent: '#ec4899' },
};

function getBrandColor(name: string) {
  if (BRAND_COLORS[name]) return BRAND_COLORS[name];
  // Generate a consistent hue from the brand name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 60%, 50%)`,
    border: `hsl(${hue}, 60%, 50%)`,
    text: '',
    accent: `hsl(${hue}, 60%, 50%)`,
  };
}

function getInitials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export const BrandModelSelector = ({
  allProducts,
  selectedBrands,
  selectedSeries,
  onBrandToggle,
  onSeriesToggle,
  onClearAll,
  className,
}: BrandModelSelectorProps) => {
  const [expanded, setExpanded] = useState(true);

  // Compute brands with product counts
  const brandData = useMemo(() => {
    const counts = new Map<string, number>();
    allProducts.forEach(p => {
      if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allProducts]);

  // Compute models/series for selected brand(s)
  const modelData = useMemo(() => {
    if (selectedBrands.length === 0) return [];
    const brandProducts = allProducts.filter(p => selectedBrands.includes(p.brand));
    const counts = new Map<string, number>();
    brandProducts.forEach(p => {
      if (p.product_family) counts.set(p.product_family, (counts.get(p.product_family) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allProducts, selectedBrands]);

  // Compute product count for selected brand(s) without series filter
  const brandProductCount = useMemo(() => {
    if (selectedBrands.length === 0) return allProducts.length;
    return allProducts.filter(p => selectedBrands.includes(p.brand)).length;
  }, [allProducts, selectedBrands]);

  if (brandData.length === 0) return null;

  const hasSelection = selectedBrands.length > 0 || selectedSeries.length > 0;

  return (
    <div className={cn('mb-6', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Choose Your Brand
          </h3>
          {selectedBrands.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-medium">
              {brandProductCount} products
            </Badge>
          )}
        </div>
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={onClearAll}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Brand Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {brandData.map(brand => {
          const isSelected = selectedBrands.includes(brand.name);
          const colors = getBrandColor(brand.name);

          return (
            <motion.button
              key={brand.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBrandToggle(brand.name)}
              className={cn(
                'relative flex-shrink-0 flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[160px]',
                isSelected
                  ? 'bg-accent/10 border-accent shadow-sm shadow-accent/10'
                  : 'bg-card border-border/60 hover:border-border hover:bg-secondary/30'
              )}
            >
              {/* Brand Initials Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all',
                  isSelected ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'
                )}
                style={!isSelected && colors.accent ? {
                  backgroundColor: `${colors.accent}15`,
                  color: colors.accent,
                } : undefined}
              >
                {getInitials(brand.name)}
              </div>

              {/* Brand Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold truncate">{brand.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {brand.count} {brand.count === 1 ? 'product' : 'products'}
                </div>
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Model/Series Chips — appears when a brand is selected */}
      <AnimatePresence>
        {selectedBrands.length > 0 && modelData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2.5">
                <ArrowRight className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Select Model / Series
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  (optional — shows all if none selected)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelData.map(model => {
                  const isSelected = selectedSeries.includes(model.name);
                  return (
                    <motion.button
                      key={model.name}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSeriesToggle(model.name)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all border',
                        isSelected
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-secondary/50 text-muted-foreground border-border/60 hover:bg-secondary hover:text-foreground hover:border-border'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{model.name}</span>
                      <span className={cn(
                        'text-[10px] font-normal',
                        isSelected ? 'opacity-80' : 'opacity-50'
                      )}>
                        {model.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
