import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ProductCard from '@/components/catalog/ProductCard';
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

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';

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
  
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const iconMap: Record<string, LucideIcon> = {
    ToggleRight,
    Cable,
    Zap,
    Lightbulb,
    Fan,
    Smartphone,
    Package,
  };

  useEffect(() => {
    // Reset state immediately when route params change
    setCategory(null);
    setProducts([]);
    setBrands([]);
    setLoading(true);

    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const [catsList, productsResponse, brandsList] = await Promise.all([
          getCategories(),
          getProducts({ pageSize: 1000 }),
          getBrands(),
        ]);
        const foundCategory = catsList.find(c => c.slug === slug);
        setCategory(foundCategory || null);
        setCategories(catsList);
        setProducts(productsResponse.items);
        setBrands(brandsList);
      } catch (error) {
        console.error('Failed to fetch category data:', error);
        setCategory(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, location.key]);
  
  // Get price bounds for the category
  const priceBounds = useMemo(() => {
    const categoryProducts = products.filter(p => 
      !category || p.category.toLowerCase().includes(category.name.toLowerCase())
    );
    if (categoryProducts.length === 0) return { min: 0, max: 10000 };
    const prices = categoryProducts.map(p => p.listPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [category]);

  // Initialize price range
  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds]);

  // Get available series for the category
  const availableSeries = useMemo(() => {
    const seriesSet = new Set(
      products
        .filter(p => !category || p.category.toLowerCase().includes(category.name.toLowerCase()))
        .map(p => p.series)
    );
    return Array.from(seriesSet).filter(Boolean).sort();
  }, [category]);

  // Get available brands for the category
  const availableBrands = useMemo(() => {
    const brandSet = new Set(
      products
        .filter(p => !category || p.category.toLowerCase().includes(category.name.toLowerCase()))
        .map(p => p.brand)
    );
    return brands.filter(b => brandSet.has(b.name));
  }, [category]);
  
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Category filter (if on category page)
      const matchesCategory = !category || p.category.toLowerCase().includes(category.name.toLowerCase());
      
      // Search filter
      const matchesSearch = !localSearch || 
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.series.toLowerCase().includes(localSearch.toLowerCase());
      
      // Brand filter
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      
      // Series filter
      const matchesSeries = selectedSeries.length === 0 || selectedSeries.includes(p.series);
      
      // Price filter
      const matchesPrice = p.listPrice >= priceRange[0] && p.listPrice <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesBrand && matchesSeries && matchesPrice;
    });

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.listPrice - b.listPrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.listPrice - a.listPrice);
        break;
    }

    return result;
  }, [category, localSearch, selectedBrands, selectedSeries, priceRange, sortBy]);

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
  };

  const toggleSeries = (seriesName: string) => {
    setSelectedSeries(prev =>
      prev.includes(seriesName)
        ? prev.filter(s => s !== seriesName)
        : [...prev, seriesName]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedSeries([]);
    setPriceRange([priceBounds.min, priceBounds.max]);
    setLocalSearch('');
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedSeries.length > 0 || 
    priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max || localSearch;

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
                ({products.filter(p => p.brand === brand.name && (!category || p.category.toLowerCase().includes(category.name.toLowerCase()))).length})
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
          onValueChange={(value) => setPriceRange(value as [number, number])}
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
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white mb-4">
              {category?.name || 'All Products'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
              {category?.description || 'Browse our complete catalog'}
            </p>
          </motion.div>

          {/* All Categories Showcase */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                All Categories
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore our complete range of product categories
              </p>
            </div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <CategoryCard 
                      cat={cat} 
                      isActive={category?.slug === cat.slug} 
                      iconMap={iconMap}
                      Package={Package}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No categories found</p>
              </div>
            )}
          </motion.section>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 my-16"></div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Desktop Filters Toggle */}
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 hidden md:flex"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {selectedBrands.length + selectedSeries.length + (localSearch ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              {/* Mobile Filters Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 md:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="default" className="ml-1">
                        {selectedBrands.length + selectedSeries.length}
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
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
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

              <span className="text-sm text-muted-foreground hidden sm:inline">
                {filteredProducts.length} products
              </span>
              
              {/* View Toggle */}
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setView('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
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
              {filteredProducts.length > 0 ? (
                <motion.div 
                  layout
                  className={`grid gap-4 ${
                    view === 'grid' 
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <ProductCard product={product} index={idx} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CategoryPage;