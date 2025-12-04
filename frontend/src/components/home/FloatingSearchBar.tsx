import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { searchProducts } from '@/api/products';
import { Product } from '@/types/product';

const FloatingSearchBar = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Popular search terms
  const popularSearches = ['Switches', 'MCB 16A', 'Polycab Wire', 'Ceiling Fan', 'LED Panel'];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Update suggestions based on query
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const results = await searchProducts(query);
          setSuggestions(results.slice(0, 6));
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Failed to search products:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      navigate(`/categories?search=${encodeURIComponent(searchQuery)}`);
      setQuery('');
      setIsFocused(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigate(getProductUrl(suggestions[selectedIndex]));
      setQuery('');
      setIsFocused(false);
    } else {
      handleSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isFocused && (query.length >= 2 || query.length === 0);

  return (
    <section className="py-24">
      <div className="container max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <form onSubmit={handleSubmit} className="relative">
            <motion.div
              animate={{
                boxShadow: isFocused
                  ? '0 20px 60px hsl(var(--foreground) / 0.08)'
                  : '0 4px 20px hsl(var(--foreground) / 0.02)',
              }}
              transition={{ duration: 0.3 }}
              className={`relative flex items-center bg-background border transition-all duration-500 ${
                isFocused 
                  ? 'border-foreground/20 rounded-2xl' 
                  : 'border-border/50 rounded-full'
              }`}
            >
              <Search
                className={`absolute left-6 h-5 w-5 transition-colors duration-500 ${
                  isFocused ? 'text-foreground' : 'text-muted-foreground'
                }`}
                strokeWidth={1.5}
              />
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Search for switches, MCBs, wires, and more..."
                className="w-full pl-14 pr-14 py-5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50 transition-all duration-500"
              />

              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-6 p-1 rounded-full hover:bg-secondary/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
              >
                {/* Product Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Products
                    </p>
                    {suggestions.map((product, idx) => (
                      <Link
                        key={product.id}
                        to={getProductUrl(product)}
                        onClick={() => {
                          setQuery('');
                          setIsFocused(false);
                        }}
                        className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${
                          idx === selectedIndex ? 'bg-secondary' : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-muted-foreground/40">
                            {product.brand.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand} · {product.series} · ₹{product.listPrice.toLocaleString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div className="p-2 border-b border-border">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </p>
                    <div className="flex flex-wrap gap-2 px-3 pb-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {query.length === 0 && (
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Popular
                    </p>
                    <div className="flex flex-wrap gap-2 px-3 pb-2">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="px-3 py-1.5 text-sm border border-border hover:bg-secondary rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {query.length >= 2 && suggestions.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No products found for "{query}"</p>
                    <button
                      onClick={() => handleSearch(query)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Search all categories →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default FloatingSearchBar;