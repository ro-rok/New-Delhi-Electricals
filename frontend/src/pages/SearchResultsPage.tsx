import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ProductCard from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/api/products';
import { Product } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackSearch } = useApp();
  
  // Extract query and strip quotes if present
  const rawQuery = searchParams.get('q') || searchParams.get('search') || '';
  const queryParam = rawQuery.replace(/^["']|["']$/g, '').trim(); // Remove surrounding quotes
  const [activeSearchQuery, setActiveSearchQuery] = useState(queryParam);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Update active search query when URL param changes
  useEffect(() => {
    if (queryParam !== activeSearchQuery) {
      setActiveSearchQuery(queryParam);
      setPage(1);
    }
  }, [queryParam, activeSearchQuery]);

  // Fetch products when active search query changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!activeSearchQuery.trim()) {
        setProducts([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getProducts({
          q: activeSearchQuery.trim(),
          page,
          pageSize,
          sortBy: sortBy === 'name-asc' ? 'name' : sortBy === 'name-desc' ? 'name' : 'price',
          sortOrder: sortBy.includes('asc') ? 'asc' : 'desc',
        });
        
        setProducts(response.items);
        setTotal(response.total);
        
        // Track search
        if (activeSearchQuery.trim()) {
          trackSearch(activeSearchQuery.trim());
        }
      } catch (error) {
        console.error('Failed to fetch search results:', error);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeSearchQuery, page, sortBy, trackSearch, pageSize]);



  const sortedProducts = useMemo(() => {
    return [...products];
  }, [products, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Results Header */}
          {activeSearchQuery && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Search Results
                </h1>
                {loading ? (
                  <p className="text-muted-foreground">Searching...</p>
                ) : (
                  <p className="text-muted-foreground">
                    {total > 0 ? (
                      <>
                        Found <strong>{total}</strong> {total === 1 ? 'product' : 'products'} for "
                        <strong>{activeSearchQuery}</strong>"
                      </>
                    ) : (
                      <>No products found for "<strong>{activeSearchQuery}</strong>"</>
                    )}
                  </p>
                )}
              </div>

              {/* Sort and View Controls */}
              {total > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="name-asc">Name: A-Z</option>
                      <option value="name-desc">Name: Z-A</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                    <Button
                      type="button"
                      variant={view === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setView('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={view === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setView('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Query State */}
          {!activeSearchQuery && !loading && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
              <p className="text-muted-foreground mb-6">
                Enter a product name, SKU, brand, or category to find what you're looking for
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Results */}
          {!loading && activeSearchQuery && (
            <AnimatePresence mode="wait">
              {sortedProducts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}
                >
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} view={view} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any products matching "<strong>{activeSearchQuery}</strong>"
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <p className="text-sm text-muted-foreground">Try:</p>
                    <ul className="flex flex-wrap gap-2 justify-center list-none">
                      <li>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigate('/categories');
                          }}
                        >
                          Browse Categories
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigate('/brands');
                          }}
                        >
                          Browse Brands
                        </Button>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {!loading && total > pageSize && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default SearchResultsPage;

