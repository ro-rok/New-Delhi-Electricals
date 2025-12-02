import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { Button } from '@/components/ui/button';
import { getProductById } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { GitCompare, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ComparePage = () => {
  const { comparison, removeFromComparison, maxItems } = useApp();

  const products = useMemo(() => 
    comparison.map(id => getProductById(id)).filter(Boolean),
    [comparison]
  );

  // Get all unique spec keys
  const allSpecs = useMemo(() => {
    const specSet = new Set<string>();
    products.forEach(p => {
      Object.keys(p!.specs).forEach(key => specSet.add(key));
    });
    return Array.from(specSet);
  }, [products]);

  const emptySlots = maxItems - products.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <GitCompare className="h-6 w-6 text-accent" />
              <h1 className="text-3xl font-semibold">Compare Products</h1>
            </div>
            <p className="text-muted-foreground">
              {products.length === 0 ? 'Add products to compare' : `Comparing ${products.length} products`}
            </p>
          </motion.div>

          {/* Product Headers */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${maxItems}, minmax(200px, 1fr))` }}>
                {products.map((product, idx) => (
                  <motion.div
                    key={product!.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-4 relative group"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromComparison(product!.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {product!.brand.charAt(0)}
                      </span>
                    </div>
                    
                    <Link to={`/product/${product!.id}`} className="hover:text-accent transition-colors">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product!.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{product!.brand}</p>
                    <p className="font-semibold">₹{product!.listPrice.toLocaleString()}</p>
                  </motion.div>
                ))}
                
                {/* Empty Slots */}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <Link
                    key={`empty-${idx}`}
                    to="/"
                    className="bg-secondary/30 rounded-2xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center min-h-[280px] hover:border-accent/50 transition-colors"
                  >
                    <Plus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <span className="text-sm text-muted-foreground">Add product</span>
                  </Link>
                ))}
              </div>

              {/* Specs Comparison */}
              {products.length > 0 && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/50">
                    <h3 className="font-medium">Specifications</h3>
                  </div>
                  
                  {allSpecs.map((spec, idx) => (
                    <div
                      key={spec}
                      className={cn(
                        'grid gap-4 py-3 px-4 hover:bg-secondary/30 transition-colors',
                        idx !== allSpecs.length - 1 && 'border-b border-border'
                      )}
                      style={{ gridTemplateColumns: `repeat(${maxItems}, minmax(200px, 1fr))` }}
                    >
                      {products.map(product => {
                        const value = product!.specs[spec];
                        return (
                          <div key={product!.id} className="text-sm">
                            <span className="text-xs text-muted-foreground block mb-0.5 capitalize">{spec}</span>
                            <span className={cn(!value && 'text-muted-foreground')}>
                              {value || '—'}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <div key={i} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {products.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <GitCompare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">Add products to compare their specifications</p>
                  <Link to="/">
                    <Button>Browse Products</Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default ComparePage;
