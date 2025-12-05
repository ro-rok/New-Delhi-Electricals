import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductFamilyFilterProps {
  products: Product[];
  selectedProductFamily: string | null;
  selectedColor: string | null;
  onProductFamilySelect: (family: string | null) => void;
  onColorSelect: (color: string | null) => void;
}

// Color mapping for visual representation
const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  'White': { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-900' },
  'Grey': { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' },
  'Gray': { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' },
  'Black': { bg: 'bg-black', border: 'border-gray-900', text: 'text-white' },
  'Ivory': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-gray-900' },
  'Brown': { bg: 'bg-amber-800', border: 'border-amber-900', text: 'text-white' },
  'Beige': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-gray-900' },
  'Gold': { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-gray-900' },
  'Silver': { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-900' },
  'Red': { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  'Blue': { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  'Green': { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
};

const getColorStyle = (color: string) => {
  const normalizedColor = color.trim();
  return colorMap[normalizedColor] || {
    bg: 'bg-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-900'
  };
};

export const ProductFamilyFilter = ({
  products,
  selectedProductFamily,
  selectedColor,
  onProductFamilySelect,
  onColorSelect,
}: ProductFamilyFilterProps) => {
  // Group products by product_family (from catalog_source or series)
  const productFamilies = useMemo(() => {
    const families = new Map<string, Product[]>();
    
    products.forEach(product => {
      // Get product_family from catalog_source.product_family or fallback to series
      const productFamily = product.catalogSource?.product_family || product.series || 'Unknown';
      
      if (!families.has(productFamily)) {
        families.set(productFamily, []);
      }
      families.get(productFamily)!.push(product);
    });
    
    return Array.from(families.entries())
      .map(([family, prods]) => ({
        name: family,
        count: prods.length,
        products: prods,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [products]);

  // Get available colors for selected product family
  const availableColors = useMemo(() => {
    if (!selectedProductFamily) return [];
    
    const familyProducts = productFamilies.find(f => f.name === selectedProductFamily)?.products || [];
    const colors = new Set<string>();
    
    familyProducts.forEach(product => {
      const color = product.specs?.color;
      if (color && color.trim()) {
        colors.add(color.trim());
      }
    });
    
    return Array.from(colors).sort();
  }, [selectedProductFamily, productFamilies]);

  const handleProductFamilyClick = (family: string) => {
    if (selectedProductFamily === family) {
      onProductFamilySelect(null);
      onColorSelect(null);
    } else {
      onProductFamilySelect(family);
      onColorSelect(null); // Reset color when changing family
    }
  };

  const handleColorClick = (color: string) => {
    if (selectedColor === color) {
      onColorSelect(null);
    } else {
      onColorSelect(color);
    }
  };

  const clearFilters = () => {
    onProductFamilySelect(null);
    onColorSelect(null);
  };

  const hasActiveFilters = selectedProductFamily !== null || selectedColor !== null;

  return (
    <div className="space-y-6">
      {/* Product Families */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Families
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-xs"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {productFamilies.map((family) => {
              const isSelected = selectedProductFamily === family.name;
              
              return (
                <motion.div
                  key={family.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => handleProductFamilyClick(family.name)}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left",
                      "hover:shadow-lg",
                      isSelected
                        ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-gray-400 dark:hover:border-gray-600"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={cn(
                        "text-lg font-semibold",
                        isSelected
                          ? "text-white dark:text-black"
                          : "text-gray-900 dark:text-white"
                      )}>
                        {family.name}
                      </h4>
                      <Badge
                        variant={isSelected ? "secondary" : "outline"}
                        className={cn(
                          isSelected && "bg-white/20 dark:bg-black/20"
                        )}
                      >
                        {family.count}
                      </Badge>
                    </div>
                    <p className={cn(
                      "text-sm",
                      isSelected
                        ? "text-white/80 dark:text-black/80"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {family.count} {family.count === 1 ? 'product' : 'products'}
                    </p>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Color Filter - Only show when a product family is selected */}
      <AnimatePresence>
        {selectedProductFamily && availableColors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Colors
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {availableColors.map((color) => {
                const isSelected = selectedColor === color;
                const colorStyle = getColorStyle(color);
                
                return (
                  <motion.button
                    key={color}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorClick(color)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 transition-all duration-200",
                      "flex items-center gap-2 font-medium",
                      isSelected
                        ? "border-gray-900 dark:border-white shadow-lg ring-2 ring-gray-900 dark:ring-white ring-offset-2"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2",
                        colorStyle.bg,
                        colorStyle.border
                      )}
                    />
                    <span className={cn(
                      "text-sm",
                      isSelected
                        ? "text-gray-900 dark:text-white font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    )}>
                      {color}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1"
                      >
                        <X className="h-4 w-4" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-800"
        >
          {selectedProductFamily && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              Family: {selectedProductFamily}
              <button
                onClick={() => {
                  onProductFamilySelect(null);
                  onColorSelect(null);
                }}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedColor && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  getColorStyle(selectedColor).bg,
                  getColorStyle(selectedColor).border,
                  "border"
                )}
              />
              Color: {selectedColor}
              <button
                onClick={() => onColorSelect(null)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
};

