import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ProductCard from '@/components/catalog/ProductCard';
import { ProductFamilyFilter } from '@/components/catalog/ProductFamilyFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategories, getProducts, getBrands } from '@/api/products';
import { Category, Product, Brand } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X, Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleRight, Cable, Zap, Lightbulb, Fan, Smartphone, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';

const iconMap: Record<string, LucideIcon> = {
  ToggleRight,
  Cable,
  Zap,
  Lightbulb,
  Fan,
  Smartphone,
};

// Category Card Component with image error handling
const CategoryCard = ({ cat, isActive, iconMap, Package }: {
  cat: Category;
  isActive: boolean;
  iconMap: Record<string, LucideIcon>;
  Package: LucideIcon;
}) => {
  const [imageError, setImageError] = useState(false);
  const IconComponent = iconMap[cat.icon] || Package;
  const categoryImage = cat.image || `/category-images/${cat.slug}.jpg`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={`/category/${cat.slug}`}
        className={cn(
          "block group relative bg-white dark:bg-black rounded-2xl p-8 border transition-all duration-300 overflow-hidden",
          isActive
            ? "border-gray-900 dark:border-white shadow-lg"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-xl"
        )}
      >
        {/* Category Image */}
        <div className={cn(
          "w-full h-32 rounded-xl mb-6 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-all",
          isActive && "ring-2 ring-gray-900 dark:ring-white"
        )}>
          {!imageError && categoryImage ? (
            <img
              src={categoryImage}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center transition-colors",
              isActive
                ? "bg-gray-900 dark:bg-white"
                : "bg-gray-100 dark:bg-gray-900 group-hover:bg-gray-200 dark:group-hover:bg-gray-800"
            )}>
              <IconComponent className={cn(
                "h-12 w-12 transition-colors",
                isActive
                  ? "text-white dark:text-black"
                  : "text-gray-600 dark:text-gray-400"
              )} />
            </div>
          )}
        </div>
        <h3 className={cn(
          "text-lg font-medium mb-2 transition-colors",
          isActive
            ? "text-gray-900 dark:text-white"
            : "text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400"
        )}>
          {cat.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {cat.productCount || 0} {(cat.productCount || 0) === 1 ? 'product' : 'products'}
        </p>
      </Link>
    </motion.div>
  );
};

const CategoryPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { trackCategoryView } = useApp();

  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedProductFamily, setSelectedProductFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 500);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetchSize = 20;

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);
    try {
      const [cats, brandsList] = await Promise.all([
        getCategories(),
        getBrands()
      ]);

      const foundCategory = cats.find(c => c.slug === slug);

      if (!foundCategory) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      setCategory(foundCategory);
      setCategories(cats);
      setBrands(brandsList);

      // Fetch all products for this category to get bounds and families
      const initialResponse = await getProducts({
        category: foundCategory.name,
        pageSize: 1000, // Fetch more to populate product family filter
      });

      setAllProducts(initialResponse.items);

      if (initialResponse.items.length > 0) {
        const prices = initialResponse.items.map(p => p.listPrice);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceBounds({ min, max });
        setPriceRange([min, max]);
      }

      // Initial filtered fetch
      const filteredResponse = await getProducts({
        category: foundCategory.name,
        page: 1,
        pageSize: fetchSize,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      setProducts(filteredResponse.items);
      setHasMore(filteredResponse.items.length === fetchSize);
      setPage(1);

    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category data');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchFilteredProducts = useCallback(async (pageNum: number, isNewFilter: boolean = false) => {
    if (!category) return;

    setFilterLoading(true);
    try {
      let sortField = 'name';
      let sortOrder = 'asc';

      switch (sortBy) {
        case 'name-desc': sortOrder = 'desc'; break;
        case 'price-asc': sortField = 'listPrice'; break;
        case 'price-desc': sortField = 'listPrice'; sortOrder = 'desc'; break;
        case 'newest': sortField = 'created_at'; sortOrder = 'desc'; break;
      }

      const response = await getProducts({
        category: category.name,
        brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
        series: selectedSeries.length === 1 ? selectedSeries[0] : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sortBy: sortField,
        sortOrder: sortOrder,
        q: debouncedSearch || undefined,
        page: pageNum,
        pageSize: fetchSize,
      });

      if (isNewFilter) {
        setProducts(response.items);
      } else {
        setProducts(prev => [...prev, ...response.items]);
      }

      setHasMore(response.items.length === fetchSize);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setFilterLoading(false);
    }
  }, [category, selectedBrands, selectedSeries, priceRange, sortBy, debouncedSearch]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!loading && category) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchFilteredProducts(1, true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedBrands, selectedSeries, priceRange, sortBy, debouncedSearch]);

  const loadMore = useCallback(() => {
    if (!filterLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFilteredProducts(nextPage, false);
    }
  }, [page, filterLoading, hasMore, fetchFilteredProducts]);

  // Get available series and brands from current products
  const availableSeries = useMemo(() => {
    const seriesSet = new Set(products.map(p => p.series).filter(Boolean));
    return Array.from(seriesSet).sort();
  }, [products]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set(products.map(p => p.brand));
    return brands.filter(b => brandSet.has(b.name));
  }, [products, brands]);

  // Infinite scroll hook
  const { elementRef: loadMoreRef } = useInfiniteScroll({
    hasMore,
    loading: filterLoading,
    onLoadMore: loadMore,
    threshold: 300,
  });

  useEffect(() => {
    if (category) {
      trackCategoryView(category.name);
    }
  }, [category, trackCategoryView]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
    // Smooth scroll to top when filter changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSeries = (seriesName: string) => {
    setSelectedSeries(prev =>
      prev.includes(seriesName)
        ? prev.filter(s => s !== seriesName)
        : [...prev, seriesName]
    );
    // Smooth scroll to top when filter changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedSeries([]);
    setSelectedProductFamily(null);
    setSelectedColor(null);
    if (priceBounds.min !== undefined && priceBounds.max !== undefined) {
      setPriceRange([priceBounds.min, priceBounds.max]);
    }
    setLocalSearch('');
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedSeries.length > 0 ||
    selectedProductFamily !== null || selectedColor !== null ||
    (priceBounds.min !== undefined && priceBounds.max !== undefined &&
      (priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max)) ||
    localSearch;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <Label>Brands</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableBrands.map(brand => (
            <label
              key={brand.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
            >
              <Checkbox
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
              />
              <span className="text-sm">{brand.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                ({products.filter(p => p.brand === brand.name).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Series */}
      {availableSeries.length > 0 && (
        <div className="space-y-3">
          <Label>Series</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableSeries.map(series => (
              <label
                key={series}
                className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
              >
                <Checkbox
                  checked={selectedSeries.includes(series)}
                  onCheckedChange={() => toggleSeries(series)}
                />
                <span className="text-sm">{series}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
          </span>
        </div>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={100}
          value={priceRange}
          onValueChange={(value) => {
            setPriceRange(value as [number, number]);
            // Debounce scroll to top for price changes
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
          }}
          className="w-full"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="h-8 text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" className="w-full" onClick={() => {
            clearFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            Clear All Filters
          </Button>
        </motion.div>
      )}
    </div>
  );


  // Simplified Category List Item for Sidebar
  const CategoryListItem = ({ cat, isActive }: { cat: Category; isActive: boolean }) => {
    const IconComponent = iconMap[cat.icon] || Package;

    return (
      <Link
        to={`/category/${cat.slug}`}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        )}
      >
        <IconComponent className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive
            ? "text-white dark:text-black"
            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        )} />
        <span className="flex-1 text-sm truncate">{cat.name}</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isActive
            ? "bg-white/20 dark:bg-black/20"
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        )}>
          {cat.productCount || 0}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-2">
              {category?.name || 'All Products'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-light">
              {category?.description || 'Browse our complete catalog'}
            </p>
          </motion.div>

          {/* Main Content Layout: Sidebar + Products */}
          <div className="flex gap-6">
            {/* Left Sidebar - Categories (Desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card rounded-2xl border border-border p-5">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Categories
                </h2>
                <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <CategoryListItem
                        key={cat.id}
                        cat={cat}
                        isActive={category?.slug === cat.slug}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                      No categories found
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Side - Products Section */}
            <div className="flex-1 min-w-0">
              {/* Product Family Filter - Prominently displayed */}
              {allProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <ProductFamilyFilter
                    products={allProducts}
                    selectedProductFamily={selectedProductFamily}
                    selectedColor={selectedColor}
                    onProductFamilySelect={setSelectedProductFamily}
                    onColorSelect={setSelectedColor}
                  />
                </motion.div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mobile Categories Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 lg:hidden">
                        <Package className="h-4 w-4" />
                        Categories
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Categories</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-1">
                        {categories.length > 0 ? (
                          categories.map((cat) => (
                            <CategoryListItem
                              key={cat.id}
                              cat={cat}
                              isActive={category?.slug === cat.slug}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                            No categories found
                          </p>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Desktop Filters Toggle */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={showFilters ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2 hidden md:flex"
                    >
                      <motion.div
                        animate={{ rotate: showFilters ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </motion.div>
                      Filters
                      {hasActiveFilters && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                            {selectedBrands.length + selectedSeries.length + (selectedProductFamily ? 1 : 0) + (selectedColor ? 1 : 0) + (localSearch ? 1 : 0)}
                          </Badge>
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Mobile Filters Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 md:hidden">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                          <Badge variant="default" className="ml-1">
                            {selectedBrands.length + selectedSeries.length + (selectedProductFamily ? 1 : 0) + (selectedColor ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Active Filter Badges */}
                  <AnimatePresence>
                    {selectedBrands.map(brand => (
                      <motion.div
                        key={brand}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleBrand(brand)}
                          className="gap-1.5"
                        >
                          {brand}
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                    {selectedSeries.map(series => (
                      <motion.div
                        key={series}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleSeries(series)}
                          className="gap-1.5"
                        >
                          {series}
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Select value={sortBy} onValueChange={(value: SortOption) => {
                      setSortBy(value);
                      // Smooth scroll to top on sort change
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      <SelectTrigger className="w-40 h-9 text-sm">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                        <SelectItem value="price-asc">Price Low-High</SelectItem>
                        <SelectItem value="price-desc">Price High-Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {products.length} {products.length === 1 ? 'product' : 'products'}
                    {selectedProductFamily || selectedColor ? ` (filtered)` : ''}
                  </span>

                  {/* View Toggle */}
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={view === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-none"
                        onClick={() => setView('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-none"
                        onClick={() => setView('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                {/* Filters Sidebar (Desktop) */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.aside
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 280 }}
                      exit={{ opacity: 0, width: 0 }}
                      className="hidden md:block flex-shrink-0 overflow-hidden"
                    >
                      <div className="sticky top-24 bg-card rounded-2xl border border-border p-5 w-[280px]">
                        <FilterContent />
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>

                {/* Products Grid */}
                <div className="flex-1">
                  {filterLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`grid gap-4 ${view === 'grid'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                        }`}
                    >
                      <ProductCardSkeleton count={view === 'grid' ? 8 : 4} />
                    </motion.div>
                  ) : products.length > 0 ? (
                    <motion.div
                      layout
                      className={`grid gap-4 ${view === 'grid'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                        }`}
                    >
                      <AnimatePresence mode="popLayout">
                        {products.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{
                              delay: idx * 0.02,
                              duration: 0.3,
                              ease: [0.25, 0.1, 0.25, 1]
                            }}
                          >
                            <ProductCard product={product} index={idx} />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Infinite scroll trigger */}
                      {hasMore && (
                        <div ref={loadMoreRef} className="col-span-full py-8">
                          {filterLoading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-center"
                            >
                              <ProductCardSkeleton count={view === 'grid' ? 4 : 2} />
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* End of results message */}
                      {!hasMore && products.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="col-span-full text-center py-8 text-sm text-muted-foreground"
                        >
                          Showing all {products.length} products
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-16"
                    >
                      <p className="text-muted-foreground mb-4">No products found matching your criteria</p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CategoryPage;