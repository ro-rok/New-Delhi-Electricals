import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchProducts, products } from '@/data/mockData';
import { Product } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const { trackSearch } = useApp();

  useEffect(() => {
    if (query.length > 1) {
      const found = searchProducts(query).slice(0, 6);
      setResults(found);
      
      // Generate suggestions from SKUs and names
      const skuSuggestions = products
        .filter(p => p.sku.toLowerCase().includes(query.toLowerCase()))
        .map(p => p.sku)
        .slice(0, 3);
      const nameSuggestions = products
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .map(p => p.name)
        .slice(0, 3);
      setSuggestions([...new Set([...skuSuggestions, ...nameSuggestions])].slice(0, 4));
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [query]);

  const handleSelect = useCallback((product: Product) => {
    trackSearch(query);
    onOpenChange(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  }, [navigate, onOpenChange, query, trackSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKUs, brands..."
            className="border-0 focus-visible:ring-0 text-base px-0"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-secondary rounded-full transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 flex flex-wrap gap-2 border-b border-border"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-2"
              >
                {results.map((product, idx) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelect(product)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">IMG</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand} · {product.sku}</p>
                    </div>
                    <span className="text-sm font-semibold">₹{product.listPrice.toLocaleString()}</span>
                  </motion.button>
                ))}
              </motion.div>
            ) : query.length > 1 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-muted-foreground"
              >
                <p className="text-sm">No products found for "{query}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">Start typing to search</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
