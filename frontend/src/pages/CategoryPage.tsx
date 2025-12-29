import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

// Display label overrides for specific categories
const getCategoryDisplayName = (name: string) =>
  name === 'Circuit Protection' ? "MCB's and more" : name;

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
        <h3
          className={cn(
            "text-lg font-medium mb-2 transition-colors",
            isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400",
          )}
        >
          {getCategoryDisplayName(cat.name)}
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProductFamily, setSelectedProductFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedAmpere, setSelectedAmpere] = useState<string | null>(null);
  const [selectedWireSize, setSelectedWireSize] = useState<string | null>(null);
  const [selectedCoreCount, setSelectedCoreCount] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 500);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetchSize = 20;

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const isWiresCategory = category?.name === 'Wires & Cables';

  const normalizeAmpere = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const numericMatch = raw.match(/^(\d+(?:\.\d+)?)/);
    return numericMatch ? numericMatch[1] : raw.toLowerCase();
  };

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
        pageSize: 2000, // Fetch more to populate filters (families/series/modules)
      });

      setAllProducts(initialResponse.items);

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
      const sortField: 'name' | 'price' = sortBy.startsWith('price') ? 'price' : 'name';
      const sortOrder: 'asc' | 'desc' = sortBy.endsWith('desc') ? 'desc' : 'asc';

      const requestParams = {
        category: category.name,
        brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
        series: selectedSeries.length > 0 ? (selectedSeries.length === 1 ? selectedSeries[0] : undefined) : undefined,
        subcategory: selectedSubcategory || undefined,
        // For wires category, treat selectedProductFamily as brand selector
        productFamily: isWiresCategory ? selectedProductFamily || undefined : undefined,
        color: selectedColor || undefined,
        wireSize: selectedWireSize ? Number(selectedWireSize) : undefined,
        coreCount: selectedCoreCount ? Number(selectedCoreCount) : undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
        q: debouncedSearch || undefined,
        page: pageNum,
        pageSize: selectedModule ? 2000 : fetchSize,
      };
      
      console.log('🔍 Filter Request:', JSON.stringify(requestParams, null, 2));
      console.log('🔍 Selected filters:', {
        selectedBrands,
        selectedSubcategory,
        selectedProductFamily,
        categoryName: category.name
      });
      
      const response = await getProducts(requestParams);
      
      console.log('📦 Response items count:', response.items.length);
      if (response.items.length > 0) {
        console.log('📦 First product sample:', {
          brand: response.items[0].brand,
          subcategory: response.items[0].subcategory,
          product_family: response.items[0].product_family,
        });
      }

      // Apply frontend filtering following the same pattern as Plates
      // Backend filters: category, subcategory (if sent), brand (if 1 selected), series (if 1 selected), productFamily, color
      // Frontend filters: brand (if multiple), series (if multiple), productFamily (double-check), color (double-check), module
      const filteredItems = response.items.filter((product) => {
        // Filter by brand (if multiple brands selected, filter client-side)
        // Backend only handles single brand, so we filter multiple brands here
        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
          return false;
        }
        
        // Filter by series (if multiple series selected, filter client-side)
        // Backend only handles single series, so we filter multiple series here
        if (selectedSeries.length > 0 && !selectedSeries.includes(product.product_family)) {
          return false;
        }
        
        // Subcategory is filtered by backend, but double-check for consistency (like Plates does with productFamily/color)
        if (selectedSubcategory) {
          const productSubcat = product.subcategory?.trim() || '';
          const selectedSubcat = selectedSubcategory.trim();
          if (productSubcat.toLowerCase() !== selectedSubcat.toLowerCase()) {
            return false;
          }
        }
        
        // ProductFamily is filtered by backend, but double-check (same as Plates)
        // For wires category, use selectedProductFamily as a brand selector
        if (isWiresCategory && selectedProductFamily) {
          if (product.brand !== selectedProductFamily) return false;
        }
        // For non-wires categories, series filtering is handled above

        // Color is filtered by backend, but double-check (same as Plates)
        if (selectedColor) {
          const rawColor = product.specs?.color;
          const color = typeof rawColor === 'string'
            ? rawColor.trim()
            : rawColor != null
              ? String(rawColor).trim()
              : '';
          if (color !== selectedColor) return false;
        }

        // Module is only filtered frontend (not sent to backend, same as Plates)
        if (selectedModule) {
          const rawModule = product.specs?.mw ?? product.specs?.module_size ?? '';
          const moduleVal = typeof rawModule === 'string'
            ? rawModule.trim()
            : rawModule != null
              ? String(rawModule).trim()
              : '';
          if (moduleVal !== selectedModule) return false;
        }

        if (selectedAmpere) {
          const ampVal = normalizeAmpere(product.specs?.ampere);
          if (ampVal !== selectedAmpere) return false;
        }

        if (selectedWireSize) {
          const rawSize = (product.specs as any)?.size_sqmm ?? (product.specs as any)?.sizeSqmm;
          const sizeVal = rawSize != null ? String(rawSize) : '';
          if (sizeVal !== selectedWireSize) return false;
        }

        if (selectedCoreCount) {
          const rawCore = (product.specs as any)?.core_count ?? (product.specs as any)?.coreCount ?? 1;
          const coreVal = String(rawCore);
          if (coreVal !== selectedCoreCount) return false;
        }
        return true;
      });
      
      console.log('✅ Filtered items count:', filteredItems.length);

      // For Plates category, sort by module width (ascending)
      let sortedItems = filteredItems;
      if (category?.name === 'Plates') {
        sortedItems = [...filteredItems].sort((a, b) => {
          // Extract module value from product
          const getModuleValue = (product: Product): number => {
            const rawModule = product.specs?.mw ?? product.specs?.module_size ?? '';
            if (typeof rawModule === 'number') {
              return rawModule;
            } else if (typeof rawModule === 'string') {
              const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
              return match ? parseFloat(match[1]) : 0;
            }
            return 0;
          };
          
          const moduleA = getModuleValue(a);
          const moduleB = getModuleValue(b);
          
          // Sort by module value ascending
          if (moduleA > 0 && moduleB > 0) {
            return moduleA - moduleB;
          }
          
          // Products with modules come first
          if (moduleA > 0 && moduleB === 0) return -1;
          if (moduleA === 0 && moduleB > 0) return 1;
          
          // If both have no module, maintain original order (or sort by name)
          return a.name.localeCompare(b.name);
        });
      }

      if (isNewFilter) {
        setProducts(sortedItems);
      } else {
        setProducts(prev => [...prev, ...sortedItems]);
      }

      setHasMore(response.items.length === (selectedModule ? 2000 : fetchSize));
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setFilterLoading(false);
    }
  }, [category, selectedBrands, selectedSeries, selectedSubcategory, selectedProductFamily, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, sortBy, debouncedSearch, isWiresCategory]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Helper functions to serialize/deserialize filters to/from URL params
  const serializeFiltersToUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    }
    if (selectedSeries.length > 0) {
      params.set('series', selectedSeries.join(','));
    }
    if (selectedSubcategory) {
      params.set('subcategory', selectedSubcategory);
    }
    // Only serialize selectedProductFamily for wires category
    if (isWiresCategory && selectedProductFamily) {
      params.set('family', selectedProductFamily);
    }
    if (selectedColor) {
      params.set('color', selectedColor);
    }
    if (selectedModule) {
      params.set('module', selectedModule);
    }
    if (selectedAmpere) {
      params.set('ampere', selectedAmpere);
    }
    if (selectedWireSize) {
      params.set('wireSize', selectedWireSize);
    }
    if (selectedCoreCount) {
      params.set('coreCount', selectedCoreCount);
    }
    if (sortBy !== 'name-asc') {
      params.set('sort', sortBy);
    }
    if (localSearch) {
      params.set('search', localSearch);
    }
    
    return params;
  }, [selectedBrands, selectedSeries, selectedSubcategory, selectedProductFamily, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, sortBy, localSearch, isWiresCategory]);

  // Track if we're restoring filters to avoid saving during restoration
  const isRestoringFilters = useRef(false);
  const previousCategoryRef = useRef<string | null>(null);
  const preservedFiltersRef = useRef<{
    brands: string[];
    series: string[];
    color: string | null;
  }>({ brands: [], series: [], color: null });
  
  // Categories that should clear brand/series/color filters when switching TO them
  const categoriesThatClearBrandSeriesColor = ['Boxes', 'Circuit Protection', 'Wires & Cables'];

  // Restore filters from URL when component mounts or slug changes
  useEffect(() => {
    isRestoringFilters.current = true;
    
    const currentCategoryName = category?.name || null;
    const previousCategoryName = previousCategoryRef.current;
    
    // Check if we should clear brand/series/color filters
    const shouldClearBrandSeriesColor = currentCategoryName && categoriesThatClearBrandSeriesColor.includes(currentCategoryName);
    
    // Get URL params
    const brandsParam = searchParams.get('brands');
    const seriesParam = searchParams.get('series');
    const subcategoryParam = searchParams.get('subcategory');
    const familyParam = searchParams.get('family');
    const colorParam = searchParams.get('color');
    const moduleParam = searchParams.get('module');
    const ampereParam = searchParams.get('ampere');
    const wireSizeParam = searchParams.get('wireSize');
    const coreCountParam = searchParams.get('coreCount');
    const sortParam = searchParams.get('sort');
    const searchParam = searchParams.get('search');
    
    // Handle brand, series, and color filters - preserve across categories unless switching TO excluded categories
    if (shouldClearBrandSeriesColor) {
      // Clear brand, series, and color when switching TO excluded categories
      setSelectedBrands([]);
      setSelectedSeries([]);
      setSelectedColor(null);
      preservedFiltersRef.current = { brands: [], series: [], color: null };
    } else {
      // Preserve brand, series, and color across category switches
      // Priority: URL params > preserved filters > empty
      if (brandsParam) {
        const brands = brandsParam.split(',').filter(Boolean);
        setSelectedBrands(brands);
        preservedFiltersRef.current.brands = brands;
      } else if (previousCategoryName && !categoriesThatClearBrandSeriesColor.includes(previousCategoryName)) {
        // If coming from a non-excluded category, preserve previous filters
        if (preservedFiltersRef.current.brands.length > 0) {
          setSelectedBrands(preservedFiltersRef.current.brands);
        } else {
          setSelectedBrands([]);
        }
      } else {
        setSelectedBrands([]);
      }
      
      if (seriesParam) {
        const series = seriesParam.split(',').filter(Boolean);
        setSelectedSeries(series);
        preservedFiltersRef.current.series = series;
      } else if (previousCategoryName && !categoriesThatClearBrandSeriesColor.includes(previousCategoryName)) {
        if (preservedFiltersRef.current.series.length > 0) {
          setSelectedSeries(preservedFiltersRef.current.series);
        } else {
          setSelectedSeries([]);
        }
      } else {
        setSelectedSeries([]);
      }
      
      if (colorParam) {
        setSelectedColor(colorParam);
        preservedFiltersRef.current.color = colorParam;
      } else if (previousCategoryName && !categoriesThatClearBrandSeriesColor.includes(previousCategoryName)) {
        if (preservedFiltersRef.current.color) {
          setSelectedColor(preservedFiltersRef.current.color);
        } else {
          setSelectedColor(null);
        }
      } else {
        setSelectedColor(null);
      }
    }
    
    // Restore other filters (category-specific)
    if (subcategoryParam) {
      setSelectedSubcategory(subcategoryParam);
    } else {
      // Clear subcategory when switching categories (it's category-specific)
      setSelectedSubcategory(null);
    }
    
    // Only restore selectedProductFamily for wires category
    if (category?.name === 'Wires & Cables' && familyParam) {
      setSelectedProductFamily(familyParam);
    } else {
      setSelectedProductFamily(null);
    }
    
    // Clear category-specific filters when switching categories
    if (moduleParam) {
      setSelectedModule(moduleParam);
    } else {
      setSelectedModule(null);
    }
    
    if (ampereParam) {
      setSelectedAmpere(ampereParam);
    } else {
      setSelectedAmpere(null);
    }
    
    if (wireSizeParam) {
      setSelectedWireSize(wireSizeParam);
    } else {
      setSelectedWireSize(null);
    }
    
    if (coreCountParam) {
      setSelectedCoreCount(coreCountParam);
    } else {
      setSelectedCoreCount(null);
    }
    
    if (sortParam && ['name-asc', 'name-desc', 'price-asc', 'price-desc', 'newest'].includes(sortParam)) {
      setSortBy(sortParam as SortOption);
    }
    
    if (searchParam !== null) {
      setLocalSearch(searchParam);
    } else {
      setLocalSearch('');
    }
    
    setPage(1);
    
    // Update preserved filters from current state (for next category switch)
    if (!shouldClearBrandSeriesColor && currentCategoryName) {
      preservedFiltersRef.current = {
        brands: brandsParam ? brandsParam.split(',').filter(Boolean) : preservedFiltersRef.current.brands,
        series: seriesParam ? seriesParam.split(',').filter(Boolean) : preservedFiltersRef.current.series,
        color: colorParam || preservedFiltersRef.current.color,
      };
    }
    
    // Update previous category ref
    previousCategoryRef.current = currentCategoryName;
    
    // Mark restoration as complete after a brief delay
    setTimeout(() => {
      isRestoringFilters.current = false;
    }, 200);
  }, [slug, category, searchParams]); // Depend on slug, category, and searchParams to handle category changes

  // Save filters to URL when they change (but not during restoration)
  useEffect(() => {
    if (isRestoringFilters.current) {
      return;
    }
    
    // Update preserved filters ref when brand/series/color change (for non-excluded categories)
    if (category && !categoriesThatClearBrandSeriesColor.includes(category.name)) {
      preservedFiltersRef.current = {
        brands: selectedBrands,
        series: selectedSeries,
        color: selectedColor,
      };
    }
    
    const params = serializeFiltersToUrl();
    // Preserve existing search param if not set by filters
    if (!params.has('search') && searchQuery) {
      params.set('search', searchQuery);
    }
    
    setSearchParams(params, { replace: true });
  }, [selectedBrands, selectedSeries, selectedSubcategory, selectedProductFamily, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, sortBy, localSearch, serializeFiltersToUrl, setSearchParams, searchQuery, category]);

  // Clear subcategory filter when switching away from Circuit Protection
  useEffect(() => {
    if (category && category.name !== 'Circuit Protection' && selectedSubcategory) {
      setSelectedSubcategory(null);
    }
  }, [category, selectedSubcategory]);

  useEffect(() => {
    if (!loading && category) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchFilteredProducts(1, true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedBrands, selectedSeries, selectedSubcategory, selectedProductFamily, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, sortBy, debouncedSearch, loading, category, fetchFilteredProducts]);

  // For wires category, keep the top brand selector (ProductFamilyFilter) and sidebar Brands in sync
  useEffect(() => {
    if (!isWiresCategory) return;
    if (selectedProductFamily) {
      setSelectedBrands((prev) =>
        prev.length === 1 && prev[0] === selectedProductFamily ? prev : [selectedProductFamily]
      );
    } else if (selectedBrands.length === 1) {
      // If brand chip is cleared, also clear sidebar single-brand selection
      setSelectedBrands([]);
    }
  }, [isWiresCategory, selectedProductFamily, selectedBrands.length]);

  const loadMore = useCallback(() => {
    if (!filterLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFilteredProducts(nextPage, false);
    }
  }, [page, filterLoading, hasMore, fetchFilteredProducts]);

  // Get available families/series/brands/modules from all category products
  const productFamilies = useMemo(() => {
    const families = new Map<string, Product[]>();
    allProducts.forEach(product => {
      const family = product.product_family || 'Unknown';
      if (!families.has(family)) {
        families.set(family, []);
      }
      families.get(family)!.push(product);
    });
    return Array.from(families.entries())
      .map(([family, prods]) => ({ name: family, count: prods.length, products: prods }))
      .sort((a, b) => b.count - a.count);
  }, [allProducts]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set(allProducts.map(p => p.brand));
    return brands.filter(b => brandSet.has(b.name));
  }, [allProducts, brands]);

  const availableSeries = useMemo(() => {
    const source = selectedBrands.length
      ? allProducts.filter(p => selectedBrands.includes(p.brand))
      : allProducts;
    const seriesSet = new Set(source.map(p => p.product_family).filter(Boolean));
    return Array.from(seriesSet).sort();
  }, [allProducts, selectedBrands]);

  // Subcategories for Circuit Protection - ordered as specified
  const availableSubcategories = useMemo(() => {
    if (category?.name !== 'Circuit Protection') return [];
    
    // Filter products by selected brands if any are selected
    let sourceProducts = allProducts;
    if (selectedBrands.length > 0) {
      sourceProducts = allProducts.filter(p => selectedBrands.includes(p.brand));
    }
    
    const subcategoryMap = new Map<string, number>();
    sourceProducts.forEach(p => {
      if (p.subcategory) {
        // Use the exact subcategory value from the product
        const subcat = p.subcategory.trim();
        subcategoryMap.set(subcat, (subcategoryMap.get(subcat) || 0) + 1);
      }
    });

    // Log available subcategories for debugging
    console.log('📋 Available subcategories:', Array.from(subcategoryMap.keys()));
    console.log('📋 Source products count:', sourceProducts.length);
    console.log('📋 Selected brands:', selectedBrands);

    // Define the order: MCBs first, then ELCB/RCCB, then Isolators, then others
    const orderPriority: Record<string, number> = {
      'Miniature Circuit Breakers (MCBs)': 1,
      'Residual Current Circuit Breakers (RCCBs/ELCBs)': 2,
      'Isolators': 3,
    };

    return Array.from(subcategoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const priorityA = orderPriority[a.name] || 999;
        const priorityB = orderPriority[b.name] || 999;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.name.localeCompare(b.name);
      });
  }, [allProducts, category, selectedBrands]);

  const availableColors = useMemo(() => {
    // For wires category, use selectedProductFamily
    if (isWiresCategory) {
      if (!selectedProductFamily) return [];
      const familyProducts = productFamilies.find(f => f.name === selectedProductFamily)?.products || [];
      const colors = new Set<string>();
      familyProducts.forEach(p => {
        const rawColor = p.specs?.color;
        if (typeof rawColor === 'string') {
          const trimmed = rawColor.trim();
          if (trimmed) colors.add(trimmed);
        } else if (rawColor != null) {
          const trimmed = String(rawColor).trim();
          if (trimmed) colors.add(trimmed);
        }
      });
      return Array.from(colors).sort();
    }
    
    // For non-wires categories, use selectedSeries
    if (selectedSeries.length === 0) return [];
    const seriesProducts = allProducts.filter(p => selectedSeries.includes(p.product_family));
    const colors = new Set<string>();
    seriesProducts.forEach(p => {
      const rawColor = p.specs?.color;
      if (typeof rawColor === 'string') {
        const trimmed = rawColor.trim();
        if (trimmed) colors.add(trimmed);
      } else if (rawColor != null) {
        const trimmed = String(rawColor).trim();
        if (trimmed) colors.add(trimmed);
      }
    });
    return Array.from(colors).sort();
  }, [productFamilies, selectedProductFamily, selectedSeries, allProducts, isWiresCategory]);

  const availableModules = useMemo(() => {
    let source = allProducts;
    if (selectedBrands.length) {
      source = source.filter(p => selectedBrands.includes(p.brand));
    }
    if (selectedSeries.length) {
      source = source.filter(p => selectedSeries.includes(p.product_family));
    }
    // For wires category, also filter by selectedProductFamily (which acts as brand)
    if (isWiresCategory && selectedProductFamily) {
      source = source.filter(p => p.brand === selectedProductFamily);
    }
    const modules = new Set<string>();
    source.forEach(p => {
      const rawModule = p.specs?.mw ?? p.specs?.module_size ?? '';
      let moduleVal = '';
      
      if (typeof rawModule === 'number') {
        // If it's a number, convert to string
        moduleVal = String(rawModule);
      } else if (typeof rawModule === 'string') {
        // If it's a string, extract the number part (e.g., "2M" -> "2", "12" -> "12")
        const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
        moduleVal = match ? match[1] : rawModule.trim();
      }
      
      if (moduleVal) modules.add(moduleVal);
    });
    
    // Sort modules numerically: 1, 2, 3, 4, 6, 8, 12, 16, 18, etc.
    const sorted = Array.from(modules).sort((a, b) => {
      // Extract numeric value from module string
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      
      // If both are valid numbers, sort numerically
      if (numA > 0 && numB > 0) {
        return numA - numB;
      }
      
      // If one is not a number, put numbers first
      if (numA > 0 && numB === 0) return -1;
      if (numA === 0 && numB > 0) return 1;
      
      // If neither is a number, sort alphabetically
      return a.localeCompare(b);
    });
    
    return sorted;
  }, [allProducts, selectedBrands, selectedSeries, selectedProductFamily, isWiresCategory]);

  // For non-Wires categories, compute product families (series) limited to the currently selected brands
  const brandFilteredFamilies = useMemo(() => {
    if (isWiresCategory) return [];
    
    // If no brands selected, show all families
    if (!selectedBrands.length) {
      return productFamilies;
    }

    // If brands selected, filter families by those brands
    return productFamilies
      .map(family => {
        const brandMatchedProducts = family.products.filter(p => selectedBrands.includes(p.brand));
        return {
          ...family,
          count: brandMatchedProducts.length,
          products: brandMatchedProducts,
        };
      })
      .filter(family => family.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [productFamilies, selectedBrands, isWiresCategory]);

  const availableWireSizes = useMemo(() => {
    if (category?.name !== 'Wires & Cables') return [];
    const sizes = new Set<string>();
    allProducts.forEach(p => {
      const raw = (p.specs as any)?.size_sqmm ?? (p.specs as any)?.sizeSqmm;
      if (raw !== undefined && raw !== null && raw !== '') {
        sizes.add(String(raw));
      }
    });
    return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  }, [allProducts, category]);

  const availableCoreCounts = useMemo(() => {
    if (category?.name !== 'Wires & Cables') return [];
    const cores = new Set<string>();
    allProducts.forEach(p => {
      const raw = (p.specs as any)?.core_count ?? (p.specs as any)?.coreCount;
      if (raw !== undefined && raw !== null && raw !== '') {
        cores.add(String(raw));
      }
    });
    return Array.from(cores).sort((a, b) => Number(a) - Number(b));
  }, [allProducts, category]);

  const availableAmperes = useMemo(() => {
    if (category?.name !== 'Circuit Protection') return [];

    let source = allProducts;
    if (selectedBrands.length) {
      source = source.filter(p => selectedBrands.includes(p.brand));
    }
    if (selectedSubcategory) {
      const selected = selectedSubcategory.trim().toLowerCase();
      source = source.filter(p => (p.subcategory || '').trim().toLowerCase() === selected);
    }
    if (selectedSeries.length) {
      source = source.filter(p => selectedSeries.includes(p.product_family));
    }

    const ampereCounts = new Map<string, { label: string; count: number }>();

    source.forEach(p => {
      const normalized = normalizeAmpere(p.specs?.ampere);
      if (!normalized) return;
      const label = /^[\d.]+$/.test(normalized) ? `${normalized}A` : (String(p.specs?.ampere).trim() || normalized);
      const existing = ampereCounts.get(normalized);
      if (existing) {
        ampereCounts.set(normalized, { ...existing, count: existing.count + 1 });
      } else {
        ampereCounts.set(normalized, { label, count: 1 });
      }
    });

    return Array.from(ampereCounts.entries())
      .map(([value, meta]) => ({ value, label: meta.label, count: meta.count }))
      .sort((a, b) => {
        const numA = Number(a.value);
        const numB = Number(b.value);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }
        return a.label.localeCompare(b.label);
      });
      }, [allProducts, category, selectedBrands, selectedSubcategory, selectedSeries]);

  // When brand changes, clear invalid series (but don't auto-select)
  useEffect(() => {
    if (!selectedBrands.length) {
      setSelectedSeries([]);
      return;
    }
    const validSeries = availableSeries;
    setSelectedSeries(prev => {
      // Only keep valid series, remove invalid ones
      const stillValid = prev.filter(s => validSeries.includes(s));
      // If more than one series is selected, keep only the first one
      return stillValid.length > 0 ? [stillValid[0]] : [];
    });
  }, [availableSeries, selectedBrands]);

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
    setSelectedSeries(prev => {
      // Single selection: if already selected, deselect; otherwise, select only this one
      if (prev.includes(seriesName)) {
        return [];
      } else {
        return [seriesName];
      }
    });
    // Smooth scroll to top when filter changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedSeries([]);
    setSelectedSubcategory(null);
    setSelectedProductFamily(null);
    setSelectedColor(null);
    setSelectedModule(null);
    setSelectedAmpere(null);
    setSelectedWireSize(null);
    setSelectedCoreCount(null);
    setLocalSearch('');
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedSeries.length > 0 ||
    selectedSubcategory !== null || selectedColor !== null || selectedModule !== null ||
    selectedAmpere !== null || selectedWireSize !== null || selectedCoreCount !== null ||
    localSearch;

  // Sort products by module width for Plates category
  const sortedProducts = useMemo(() => {
    if (category?.name !== 'Plates') {
      return products;
    }
    
    return [...products].sort((a, b) => {
      // Extract module value from product
      const getModuleValue = (product: Product): number => {
        const rawModule = product.specs?.mw ?? product.specs?.module_size ?? '';
        if (typeof rawModule === 'number') {
          return rawModule;
        } else if (typeof rawModule === 'string') {
          const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0;
        }
        return 0;
      };
      
      const moduleA = getModuleValue(a);
      const moduleB = getModuleValue(b);
      
      // Sort by module value ascending
      if (moduleA > 0 && moduleB > 0) {
        return moduleA - moduleB;
      }
      
      // Products with modules come first
      if (moduleA > 0 && moduleB === 0) return -1;
      if (moduleA === 0 && moduleB > 0) return 1;
      
      // If both have no module, maintain original order (or sort by name)
      return a.name.localeCompare(b.name);
    });
  }, [products, category]);

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


      {/* Colors (depends on series/family) */}
      {((isWiresCategory && selectedProductFamily) || (!isWiresCategory && selectedSeries.length > 0)) && availableColors.length > 0 && (
        <div className="space-y-3">
          <Label>Available Colors</Label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => (
              <Button
                key={color}
                variant={selectedColor === color ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedColor(prev => prev === color ? null : color)}
                className="gap-2"
              >
                <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/40" />
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}

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
                ({allProducts.filter(p => p.brand === brand.name).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Wire Size (sqmm) - Wires & Cables */}
      {category?.name === 'Wires & Cables' && availableWireSizes.length > 0 && (
        <div className="space-y-3">
          <Label>Wire Size (sqmm)</Label>
          <div className="flex flex-wrap gap-2">
            {availableWireSizes.map(size => (
              <Button
                key={size}
                variant={selectedWireSize === size ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedWireSize(prev => prev === size ? null : size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Core Count - Wires & Cables */}
      {category?.name === 'Wires & Cables' && availableCoreCounts.length > 0 && (
        <div className="space-y-3">
          <Label>Wire Core</Label>
          <div className="flex flex-wrap gap-2">
            {availableCoreCounts.map(core => (
              <Button
                key={core}
                variant={selectedCoreCount === core ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedCoreCount(prev => prev === core ? null : core)}
              >
                {core} Core
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Series - Only show for non-Circuit Protection categories, filtered by selected brands */}
      {category?.name !== 'Circuit Protection' && availableSeries.length > 0 && (
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
                <span className="text-xs text-muted-foreground ml-auto">
                  ({allProducts.filter(p => p.product_family === series && (selectedBrands.length === 0 || selectedBrands.includes(p.brand))).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory - Only show for Circuit Protection */}
      {category?.name === 'Circuit Protection' && availableSubcategories.length > 0 && (
        <div className="space-y-3">
          <Label>Subcategory</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableSubcategories.map(subcat => (
              <label
                key={subcat.name}
                className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors"
              >
                <Checkbox
                  checked={selectedSubcategory === subcat.name}
                  onCheckedChange={() => {
                    setSelectedSubcategory(prev => prev === subcat.name ? null : subcat.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                <span className="text-sm">{subcat.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({subcat.count})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Module (Plates) */}
      {availableModules.length > 0 && (
        <div className="space-y-3">
          <Label>Module</Label>
          <div className="flex flex-wrap gap-2">
            {availableModules.map(moduleVal => (
              <Button
                key={moduleVal}
                variant={selectedModule === moduleVal ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedModule(prev => prev === moduleVal ? null : moduleVal)}
                className="gap-2"
              >
                {moduleVal}M
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Ampere - Circuit Protection */}
      {category?.name === 'Circuit Protection' && availableAmperes.length > 0 && (
        <div className="space-y-3">
          <Label>Ampere</Label>
          <div className="flex flex-wrap gap-2">
            {availableAmperes.map(amp => (
              <Button
                key={amp.value}
                variant={selectedAmpere === amp.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedAmpere(prev => prev === amp.value ? null : amp.value)}
              >
                {amp.label}
              </Button>
            ))}
          </div>
        </div>
      )}

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
              {/* Top brand & family cards */}
              {allProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 space-y-8"
                >
                  {isWiresCategory ? (
                    // For Wires & Cables, keep existing ProductFamilyFilter behavior (brands + colors)
                    <ProductFamilyFilter
                      products={allProducts}
                      selectedProductFamily={selectedProductFamily}
                      selectedColor={selectedColor}
                      onProductFamilySelect={setSelectedProductFamily}
                      onColorSelect={setSelectedColor}
                    />
                  ) : (
                    <>
                      {/* Brand cards */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Brands
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {availableBrands.map(brand => {
                            const isSelected = selectedBrands.includes(brand.name);
                            const brandProducts = allProducts.filter(p => p.brand === brand.name);
                            const count = brandProducts.length;

                            return (
                              <motion.div
                                key={brand.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <button
                                  onClick={() => toggleBrand(brand.name)}
                                  className={cn(
                                    "w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left",
                                    "hover:shadow-lg",
                                    isSelected
                                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl"
                                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-gray-400 dark:hover:border-gray-600"
                                  )}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4
                                      className={cn(
                                        "text-lg font-semibold",
                                        isSelected
                                          ? "text-white dark:text-black"
                                          : "text-gray-900 dark:text-white"
                                      )}
                                    >
                                      {brand.name}
                                    </h4>
                                    <Badge
                                      variant={isSelected ? "secondary" : "outline"}
                                      className={cn(
                                        isSelected && "bg-white/20 dark:bg-black/20"
                                      )}
                                    >
                                      {count}
                                    </Badge>
                                  </div>
                                  <p
                                    className={cn(
                                      "text-sm",
                                      isSelected
                                        ? "text-white/80 dark:text-black/80"
                                        : "text-gray-600 dark:text-gray-400"
                                    )}
                                  >
                                    {count} {count === 1 ? "product" : "products"}
                                  </p>
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Series filtered by selected brands */}
                      {brandFilteredFamilies.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Series
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {brandFilteredFamilies.map(family => {
                              const isSelected = selectedSeries.includes(family.name);

                              return (
                                <motion.div
                                  key={family.name}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <button
                                    onClick={() => {
                                      // Single selection: if already selected, deselect; otherwise, select only this one
                                      setSelectedSeries(prev => {
                                        if (prev.includes(family.name)) {
                                          return [];
                                        } else {
                                          return [family.name];
                                        }
                                      });
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={cn(
                                      "w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left",
                                      "hover:shadow-lg",
                                      isSelected
                                        ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl"
                                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-gray-400 dark:hover:border-gray-600"
                                    )}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4
                                        className={cn(
                                          "text-lg font-semibold",
                                          isSelected
                                            ? "text-white dark:text-black"
                                            : "text-gray-900 dark:text-white"
                                        )}
                                      >
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
                                    <p
                                      className={cn(
                                        "text-sm",
                                        isSelected
                                          ? "text-white/80 dark:text-black/80"
                                          : "text-gray-600 dark:text-gray-400"
                                      )}
                                    >
                                      {family.count}{" "}
                                      {family.count === 1 ? "product" : "products"}
                                    </p>
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                            {selectedBrands.length
                              + selectedSeries.length
                              + (selectedSubcategory ? 1 : 0)
                              + (selectedColor ? 1 : 0)
                              + (selectedModule ? 1 : 0)
                              + (selectedAmpere ? 1 : 0)
                              + (selectedWireSize ? 1 : 0)
                              + (selectedCoreCount ? 1 : 0)
                              + (localSearch ? 1 : 0)}
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
                            {selectedBrands.length
                              + selectedSeries.length
                              + (selectedSubcategory ? 1 : 0)
                              + (selectedColor ? 1 : 0)
                              + (selectedModule ? 1 : 0)
                              + (selectedAmpere ? 1 : 0)
                              + (selectedWireSize ? 1 : 0)
                              + (selectedCoreCount ? 1 : 0)}
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
                    {selectedSubcategory && (
                      <motion.div
                        key={`subcategory-${selectedSubcategory}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedSubcategory(null)}
                          className="gap-1.5"
                        >
                          {selectedSubcategory}
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                    {selectedColor && (
                      <motion.div
                        key={`color-${selectedColor}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedColor(null)}
                          className="gap-1.5"
                        >
                          {selectedColor}
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                    {selectedModule && (
                      <motion.div
                        key={`module-${selectedModule}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedModule(null)}
                          className="gap-1.5"
                        >
                          {selectedModule}M
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
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
                    {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
                    {(selectedSeries.length > 0 || selectedProductFamily || selectedColor || selectedBrands.length > 0 || selectedSubcategory || selectedModule || selectedAmpere || selectedWireSize || selectedCoreCount) ? ` (filtered)` : ''}
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
                  ) : sortedProducts.length > 0 ? (
                    <motion.div
                      layout
                      className={`grid gap-4 ${view === 'grid'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                        }`}
                    >
                      <AnimatePresence mode="popLayout">
                        {sortedProducts.map((product, idx) => (
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
                      {!hasMore && sortedProducts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="col-span-full text-center py-8 text-sm text-muted-foreground"
                        >
                          Showing all {sortedProducts.length} products
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