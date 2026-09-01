import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { getBrands } from '@/api/products';
import { Product, Brand } from '@/types/product';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleRight, Shield, Cable, Box, LayoutGrid, Package, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlateSelectionWizard } from '@/components/catalog/PlateSelectionWizard';
import { BrandModelSelector } from '@/components/catalog/BrandModelSelector';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { SEOHead } from '@/components/SEOHead';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  SHOPPING_CATEGORIES,
  getShoppingCategory,
  isLegacySlug,
  getCanonicalSlug,
  ShoppingCategory,
  SubSection,
} from '@/config/shoppingCategories';
import { fetchProductsForShoppingCategory } from '@/lib/categoryUtils';
import { getCategorySEO } from '@/lib/seo';
import { useInitialRouteData } from '@/lib/initialRouteData';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

// Product names in the catalogue are ASCII. A code-point comparison gives the
// browser and Node prerenderer one deterministic tie-breaker, avoiding a
// post-hydration reshuffle caused by their different locale defaults.
const compareProductNames = (left: Product, right: Product) => {
  const a = left.name.toLowerCase();
  const b = right.name.toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  const leftKey = String(left.urlPath || left.sku || left.id);
  const rightKey = String(right.urlPath || right.sku || right.id);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
};

const iconMap: Record<string, LucideIcon> = {
  ToggleRight,
  Shield,
  Cable,
  Box,
  LayoutGrid,
  Package,
  Thermometer,
};

const CategoryPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const subTab = searchParams.get('tab') || 'all';
  const { trackCategoryView } = useApp();
  const initialData = useInitialRouteData();
  const hasInitialData = initialData?.pathname === location.pathname && Array.isArray(initialData.products);

  // Shopping category (new architecture)
  const shoppingCategory = useMemo(() => getShoppingCategory(slug || ''), [slug]);
  // Handle legacy slugs by redirecting to canonical URL
  const resolvedSlug = useMemo(() => {
    if (!slug) return '';
    if (isLegacySlug(slug)) return getCanonicalSlug(slug);
    return slug;
  }, [slug]);

  const [allProducts, setAllProducts] = useState<Product[]>(() => hasInitialData ? initialData?.products ?? [] : []);
  const [products, setProducts] = useState<Product[]>(() => hasInitialData ? (initialData?.products ?? []).slice(0, 20) : []);
  const [brands, setBrands] = useState<Brand[]>(() => hasInitialData ? initialData?.brands ?? [] : []);
  const [loading, setLoading] = useState(!hasInitialData);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedAmpere, setSelectedAmpere] = useState<string | null>(null);
  const [selectedWireSize, setSelectedWireSize] = useState<string | null>(null);
  const [selectedCoreCount, setSelectedCoreCount] = useState<string | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 500);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const fetchSize = 20;

  // Active sub-section tab
  const [activeTab, setActiveTab] = useState(subTab);

  const isWiresCategory = shoppingCategory?.slug === 'wires-cables';
  const isCircuitProtection = shoppingCategory?.slug === 'circuit-protection';
  const isGeysersCategory = shoppingCategory?.slug === 'geysers';

  const normalizeAmpere = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const numericMatch = raw.match(/^(\d+(?:\.\d+)?)/);
    return numericMatch ? numericMatch[1] : raw.toLowerCase();
  };

  // Smart sort priority for Switches & Sockets — the natural shopping order:
  // 1. Switches (6A→10A→16A→20A) → 2. Sockets (6A→16A) → 3. Fan regulators/dimmers
  // → 4. Data sockets/USB → 5. Mini MCBs (after regulators, NOT with switches) → 6. Accessories
  const getSmartSortPriority = useCallback((product: Product): number => {
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const amp = normalizeAmpere(product.specs?.ampere);

    // Detect Mini MCBs early — these are circuit protection, NOT switches
    const isMiniMCB = name.includes('mini mcb') || name.includes('mini-mcb') ||
      (name.includes('mcb') && !name.includes('switch'));

    // Base category priority — MCBs go AFTER regulators/data, NOT with switches
    let catPriority = 100;
    if (cat === 'switches' && !isMiniMCB) catPriority = 0;
    else if (cat === 'power sockets') catPriority = 10;
    else if (cat === 'fan controls') catPriority = 20;
    else if (cat === 'dimmers') catPriority = 25;
    else if (cat === 'data sockets') catPriority = 35;
    else if (isMiniMCB) catPriority = 40; // After data/USB, before accessories
    else if (cat === 'accessories' || cat === 'hospitality') catPriority = 50;

    // Ampere sub-priority within each category: 6A < 10A < 16A < 20A < 25A < 32A < 40A < 63A
    let ampPriority = 0;
    const ampNum = parseFloat(amp);
    if (ampNum <= 6) ampPriority = 0;
    else if (ampNum <= 10) ampPriority = 1;
    else if (ampNum <= 16) ampPriority = 2;
    else if (ampNum <= 20) ampPriority = 3;
    else if (ampNum <= 25) ampPriority = 4;
    else if (ampNum <= 32) ampPriority = 5;
    else if (ampNum <= 40) ampPriority = 6;
    else ampPriority = 7;

    // Module size sub-priority: 1M < 2M < 3M < 4M < 6M < 8M < 12M
    let modulePriority = 0;
    const rawModule = product.specs?.mw ?? product.specs?.module_size ?? '';
    let moduleVal = 0;
    if (typeof rawModule === 'number') moduleVal = rawModule;
    else if (typeof rawModule === 'string') {
      const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
      moduleVal = match ? parseFloat(match[1]) : 0;
    }
    if (moduleVal <= 1) modulePriority = 0;
    else if (moduleVal <= 2) modulePriority = 1;
    else if (moduleVal <= 3) modulePriority = 2;
    else if (moduleVal <= 4) modulePriority = 3;
    else if (moduleVal <= 6) modulePriority = 4;
    else if (moduleVal <= 8) modulePriority = 5;
    else modulePriority = 6;

    // Within switches: 1-way before 2-way, standard before soft-feel, etc.
    let typePriority = 0;
    if (cat === 'switches' && !isMiniMCB) {
      if (name.includes('2-way') || name.includes('two way')) typePriority = 1;
      if (name.includes('indicator')) typePriority = 2;
      if (name.includes('soft feel') || name.includes('softfeel')) typePriority = 3;
      if (name.includes('dp switch')) typePriority = 4;
      if (name.includes('mega') || name.includes('2 module')) typePriority = 5;
      if (name.includes('motor starter')) typePriority = 6;
      if (name.includes('wi-fi') || name.includes('wifi')) typePriority = 7;
      if (name.includes('ir ')) typePriority = 8;
    }

    return catPriority * 10000 + ampPriority * 1000 + modulePriority * 100 + typePriority * 10;
  }, []);

  // Redirect legacy slugs
  useEffect(() => {
    if (slug && isLegacySlug(slug)) {
      const canonical = getCanonicalSlug(slug);
      // Use replaceState to update URL without navigation loop
      const url = new URL(window.location.href);
      url.pathname = `/category/${canonical}`;
      window.history.replaceState({}, '', url.toString());
    }
  }, [slug]);

  // Determine which DB categories to fetch for the active tab
  const activeDbCategories = useMemo(() => {
    if (!shoppingCategory) return [];
    const tab = shoppingCategory.subSections.find(s => s.id === activeTab);
    return tab ? tab.dbCategories : shoppingCategory.dbCategories;
  }, [shoppingCategory, activeTab]);

  // Fetch all products for this shopping category
  const fetchInitialData = useCallback(async () => {
    if (!resolvedSlug) return;
    setLoading(!hasInitialData);
    setError(null);

    try {
      const brandsList = await getBrands();
      setBrands(brandsList);

      if (shoppingCategory) {
        // Fetch all products across all DB categories in this shopping family
        const response = await fetchProductsForShoppingCategory(resolvedSlug, { pageSize: 2000 });
        setAllProducts(response.items);
        setProducts(response.items.slice(0, fetchSize));
        setHasMore(response.items.length > fetchSize);
      } else {
        setError('Category not found');
      }
    } catch (err) {
      setError('Failed to load category data');
    } finally {
      setLoading(false);
    }
  }, [resolvedSlug, shoppingCategory, hasInitialData]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, hasInitialData]);

  // Filter products by active tab and filters
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by active sub-section tab
    if (activeTab !== 'all' && shoppingCategory) {
      const tab = shoppingCategory.subSections.find(s => s.id === activeTab);
      if (tab) {
        filtered = filtered.filter(p => tab.dbCategories.includes(p.category));
      }
    }

    // Apply brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    // Apply series filter
    if (selectedSeries.length > 0) {
      filtered = filtered.filter(p => selectedSeries.includes(p.product_family));
    }

    // Apply subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(p =>
        (p.subcategory || '').trim().toLowerCase() === selectedSubcategory.trim().toLowerCase()
      );
    }

    // Apply color filter
    if (selectedColor) {
      filtered = filtered.filter(p => {
        const rawColor = p.specs?.color;
        const color = typeof rawColor === 'string' ? rawColor.trim() : rawColor != null ? String(rawColor).trim() : '';
        return color === selectedColor;
      });
    }

    // Apply module filter
    if (selectedModule) {
      filtered = filtered.filter(p => {
        const rawModule = p.specs?.mw ?? p.specs?.module_size ?? '';
        let moduleVal = '';
        if (typeof rawModule === 'number') moduleVal = String(rawModule);
        else if (typeof rawModule === 'string') {
          const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
          moduleVal = match ? match[1] : rawModule.trim();
        }
        return moduleVal === selectedModule;
      });
    }

    // Apply ampere filter
    if (selectedAmpere) {
      filtered = filtered.filter(p => {
        const ampVal = normalizeAmpere(p.specs?.ampere);
        return ampVal === selectedAmpere;
      });
    }

    // Apply wire size filter
    if (selectedWireSize) {
      filtered = filtered.filter(p => {
        const rawSize = (p.specs as any)?.size_sqmm ?? (p.specs as any)?.sizeSqmm;
        const sizeVal = rawSize != null ? String(rawSize) : '';
        return sizeVal === selectedWireSize;
      });
    }

    // Apply core count filter
    if (selectedCoreCount) {
      filtered = filtered.filter(p => {
        const rawCore = (p.specs as any)?.core_count ?? (p.specs as any)?.coreCount ?? 1;
        return String(rawCore) === selectedCoreCount;
      });
    }

    // Apply capacity filter (for Geysers)
    if (selectedCapacity) {
      filtered = filtered.filter(p => {
        const rawCap = (p.specs as any)?.capacity_liters;
        return rawCap !== undefined && rawCap !== null && String(rawCap).trim() === selectedCapacity;
      });
    }

    // Apply search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.product_family || '').toLowerCase().includes(q)
      );
    }

    // Apply sort
    const sorted = [...filtered];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.listPrice - b.listPrice);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.listPrice - a.listPrice);
    else if (sortBy === 'name-desc') sorted.sort((a, b) => compareProductNames(b, a));
    else if (sortBy === 'name-asc') {
      // Smart sort for shopping categories — natural product order
      if (shoppingCategory?.slug === 'switches-sockets' || shoppingCategory?.slug === 'plates') {
        sorted.sort((a, b) => {
          const priorityDiff = getSmartSortPriority(a) - getSmartSortPriority(b);
          if (priorityDiff !== 0) return priorityDiff;
          return compareProductNames(a, b);
        });
      } else {
        sorted.sort(compareProductNames);
      }
    }

    return sorted;
  }, [
    allProducts, activeTab, shoppingCategory, selectedBrands, selectedSeries,
    selectedSubcategory, selectedColor, selectedModule, selectedAmpere,
    selectedWireSize, selectedCoreCount, selectedCapacity, sortBy, debouncedSearch,
  ]);

  // Paginated products
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * fetchSize);
  }, [filteredProducts, page, fetchSize]);

  useEffect(() => {
    setHasMore(displayedProducts.length < filteredProducts.length);
  }, [displayedProducts, filteredProducts]);

  // Available filter options computed from filtered products
  const availableBrands = useMemo(() => {
    const brandSet = new Set(filteredProducts.map(p => p.brand));
    return brands.filter(b => brandSet.has(b.name));
  }, [filteredProducts, brands]);

  const availableSeries = useMemo(() => {
    const seriesSet = new Set(filteredProducts.map(p => p.product_family).filter(Boolean));
    return Array.from(seriesSet).sort();
  }, [filteredProducts]);

  const availableModules = useMemo(() => {
    const modules = new Set<string>();
    filteredProducts.forEach(p => {
      const rawModule = p.specs?.mw ?? p.specs?.module_size ?? '';
      let moduleVal = '';
      if (typeof rawModule === 'number') moduleVal = String(rawModule);
      else if (typeof rawModule === 'string') {
        const match = rawModule.trim().match(/^(\d+(?:\.\d+)?)/);
        moduleVal = match ? match[1] : rawModule.trim();
      }
      if (moduleVal) modules.add(moduleVal);
    });
    return Array.from(modules).sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
  }, [filteredProducts]);

  const availableColors = useMemo(() => {
    if (selectedSeries.length === 0 && !isWiresCategory) return [];
    const source = isWiresCategory
      ? filteredProducts
      : filteredProducts.filter(p => selectedSeries.includes(p.product_family));
    const colors = new Set<string>();
    source.forEach(p => {
      const rawColor = p.specs?.color;
      const color = typeof rawColor === 'string' ? rawColor.trim() : rawColor != null ? String(rawColor).trim() : '';
      if (color) colors.add(color);
    });
    return Array.from(colors).sort();
  }, [filteredProducts, selectedSeries, isWiresCategory]);

  const availableAmperes = useMemo(() => {
    if (!isCircuitProtection) return [];
    const ampereCounts = new Map<string, { label: string; count: number }>();
    filteredProducts.forEach(p => {
      const normalized = normalizeAmpere(p.specs?.ampere);
      if (!normalized) return;
      const label = /^[\d.]+$/.test(normalized) ? `${normalized}A` : (String(p.specs?.ampere).trim() || normalized);
      const existing = ampereCounts.get(normalized);
      if (existing) ampereCounts.set(normalized, { ...existing, count: existing.count + 1 });
      else ampereCounts.set(normalized, { label, count: 1 });
    });
    return Array.from(ampereCounts.entries())
      .map(([value, meta]) => ({ value, label: meta.label, count: meta.count }))
      .sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0));
  }, [filteredProducts, isCircuitProtection]);

  const availableWireSizes = useMemo(() => {
    if (!isWiresCategory) return [];
    const sizes = new Set<string>();
    filteredProducts.forEach(p => {
      const raw = (p.specs as any)?.size_sqmm ?? (p.specs as any)?.sizeSqmm;
      if (raw !== undefined && raw !== null && raw !== '') sizes.add(String(raw));
    });
    return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  }, [filteredProducts, isWiresCategory]);

  const availableCoreCounts = useMemo(() => {
    if (!isWiresCategory) return [];
    const cores = new Set<string>();
    filteredProducts.forEach(p => {
      const raw = (p.specs as any)?.core_count ?? (p.specs as any)?.coreCount;
      if (raw !== undefined && raw !== null && raw !== '') cores.add(String(raw));
    });
    return Array.from(cores).sort((a, b) => Number(a) - Number(b));
  }, [filteredProducts, isWiresCategory]);

  const availableSubcategories = useMemo(() => {
    if (!isGeysersCategory) return [];
    const subcats = new Map<string, number>();
    allProducts.forEach(p => {
      const sub = (p.subcategory || '').trim();
      if (sub) subcats.set(sub, (subcats.get(sub) || 0) + 1);
    });
    return Array.from(subcats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts, isGeysersCategory]);

  const availableCapacities = useMemo(() => {
    if (!isGeysersCategory) return [];
    const caps = new Map<string, number>();
    allProducts.forEach(p => {
      const raw = p.specs?.capacity_liters;
      if (raw !== undefined && raw !== null && raw !== '') {
        const val = String(raw).trim();
        if (val) caps.set(val, (caps.get(val) || 0) + 1);
      }
    });
    return Array.from(caps.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => (parseFloat(a.value) || 0) - (parseFloat(b.value) || 0));
  }, [allProducts, isGeysersCategory]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!shoppingCategory) return {};
    const counts: Record<string, number> = {};
    for (const tab of shoppingCategory.subSections) {
      counts[tab.id] = allProducts.filter(p => tab.dbCategories.includes(p.category)).length;
    }
    return counts;
  }, [allProducts, shoppingCategory]);

  // URL filter sync
  const serializeFiltersToUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (selectedSeries.length > 0) params.set('series', selectedSeries.join(','));
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (selectedColor) params.set('color', selectedColor);
    if (selectedModule) params.set('module', selectedModule);
    if (selectedAmpere) params.set('ampere', selectedAmpere);
    if (selectedWireSize) params.set('wireSize', selectedWireSize);
    if (selectedCoreCount) params.set('coreCount', selectedCoreCount);
    if (selectedCapacity) params.set('capacity', selectedCapacity);
    if (sortBy !== 'name-asc') params.set('sort', sortBy);
    if (localSearch) params.set('search', localSearch);
    if (activeTab !== 'all') params.set('tab', activeTab);
    return params;
  }, [selectedBrands, selectedSeries, selectedSubcategory, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, selectedCapacity, sortBy, localSearch, activeTab]);

  const isRestoringFilters = useRef(false);
  const hasInitializedFromUrl = useRef(false);

  // Restore filters from URL
  useEffect(() => {
    isRestoringFilters.current = true;
    hasInitializedFromUrl.current = true;
    const brandsParam = searchParams.get('brands');
    const seriesParam = searchParams.get('series');
    const subcategoryParam = searchParams.get('subcategory');
    const colorParam = searchParams.get('color');
    const moduleParam = searchParams.get('module');
    const ampereParam = searchParams.get('ampere');
    const wireSizeParam = searchParams.get('wireSize');
    const coreCountParam = searchParams.get('coreCount');
    const capacityParam = searchParams.get('capacity');
    const sortParam = searchParams.get('sort');
    const searchParam = searchParams.get('search');
    const tabParam = searchParams.get('tab');

    if (brandsParam) setSelectedBrands(brandsParam.split(',').filter(Boolean));
    if (seriesParam) setSelectedSeries(seriesParam.split(',').filter(Boolean));
    if (subcategoryParam) setSelectedSubcategory(subcategoryParam);
    if (colorParam) setSelectedColor(colorParam);
    if (moduleParam) setSelectedModule(moduleParam);
    if (ampereParam) setSelectedAmpere(ampereParam);
    if (wireSizeParam) setSelectedWireSize(wireSizeParam);
    if (coreCountParam) setSelectedCoreCount(coreCountParam);
    if (capacityParam) setSelectedCapacity(capacityParam);
    if (sortParam && ['name-asc', 'name-desc', 'price-asc', 'price-desc'].includes(sortParam)) {
      setSortBy(sortParam as SortOption);
    }
    if (searchParam !== null) setLocalSearch(searchParam);
    if (tabParam) setActiveTab(tabParam);

    setPage(1);
    setTimeout(() => { isRestoringFilters.current = false; }, 200);
  }, [slug, searchParams]);

  // Save filters to URL
  useEffect(() => {
    if (isRestoringFilters.current || !hasInitializedFromUrl.current) return;
    const params = serializeFiltersToUrl();
    if (!params.has('search') && searchQuery) params.set('search', searchQuery);
    setSearchParams(params, { replace: true });
  }, [selectedBrands, selectedSeries, selectedSubcategory, selectedColor, selectedModule, selectedAmpere, selectedWireSize, selectedCoreCount, selectedCapacity, sortBy, localSearch, activeTab, serializeFiltersToUrl, setSearchParams, searchQuery]);

  // Track category view
  useEffect(() => {
    if (shoppingCategory) trackCategoryView(shoppingCategory.displayName);
  }, [shoppingCategory, trackCategoryView]);

  // Clear filters when tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSelectedBrands([]);
    setSelectedSeries([]);
    setSelectedSubcategory(null);
    setSelectedColor(null);
    setSelectedModule(null);
    setSelectedAmpere(null);
    setSelectedWireSize(null);
    setSelectedCoreCount(null);
    setSelectedCapacity(null);
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedSeries([]);
    setSelectedSubcategory(null);
    setSelectedColor(null);
    setSelectedModule(null);
    setSelectedAmpere(null);
    setSelectedWireSize(null);
    setSelectedCoreCount(null);
    setSelectedCapacity(null);
    setLocalSearch('');
    setPage(1);
  }, []);

  const hasActiveFilters = selectedBrands.length > 0 || selectedSeries.length > 0 ||
    selectedSubcategory !== null || selectedColor !== null || selectedModule !== null ||
    selectedAmpere !== null || selectedWireSize !== null || selectedCoreCount !== null || selectedCapacity !== null || localSearch;

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]);
    setPage(1);
  };

  const toggleSeries = (seriesName: string) => {
    setSelectedSeries(prev => prev.includes(seriesName) ? [] : [seriesName]);
    setPage(1);
  };

  // Next category in shopping flow
  const nextCategory = shoppingCategory?.nextStepSlug
    ? getShoppingCategory(shoppingCategory.nextStepSlug)
    : undefined;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <main className="pt-24 pb-16">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading products..." />
          </div>
        </main>
        <Footer />
        <WhatsAppFab />
      </div>
    );
  }

  // Error state
  if (error || !shoppingCategory) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <main className="pt-24 pb-16">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6">
            <div className="text-center py-20">
              <h1 className="text-2xl font-semibold mb-4">
                {error || 'Category not found'}
              </h1>
              <p className="text-muted-foreground mb-6">
                The category you're looking for doesn't exist or has been moved.
              </p>
              <Link to="/categories">
                <Button>Browse All Categories</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppFab />
      </div>
    );
  }

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
            onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Colors */}
      {availableColors.length > 0 && (
        <div className="space-y-3">
          <Label>Available Colors</Label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => (
              <Button
                key={color}
                variant={selectedColor === color ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedColor(prev => prev === color ? null : color); setPage(1); }}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {availableBrands.length > 0 && (
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
                  ({allProducts.filter(p => p.brand === brand.name && (activeTab === 'all' || shoppingCategory.subSections.find(s => s.id === activeTab)?.dbCategories.includes(p.category))).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory / Type (for Geysers) */}
      {availableSubcategories.length > 0 && (
        <div className="space-y-3">
          <Label>Type</Label>
          <div className="flex flex-wrap gap-2">
            {availableSubcategories.map(sub => (
              <Button
                key={sub.name}
                variant={selectedSubcategory === sub.name ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedSubcategory(prev => prev === sub.name ? null : sub.name); setPage(1); }}
              >
                {sub.name} ({sub.count})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Capacity (for Geysers) */}
      {availableCapacities.length > 0 && (
        <div className="space-y-3">
          <Label>Capacity (Liters)</Label>
          <div className="flex flex-wrap gap-2">
            {availableCapacities.map(cap => (
              <Button
                key={cap.value}
                variant={selectedCapacity === cap.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedCapacity(prev => prev === cap.value ? null : cap.value); setPage(1); }}
              >
                {cap.value}L ({cap.count})
              </Button>
            ))}
          </div>
        </div>
      )}

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
                <span className="text-xs text-muted-foreground ml-auto">
                  ({filteredProducts.filter(p => p.product_family === series).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Module size */}
      {availableModules.length > 0 && (
        <div className="space-y-3">
          <Label>Module Size</Label>
          <div className="flex flex-wrap gap-2">
            {availableModules.map(moduleVal => (
              <Button
                key={moduleVal}
                variant={selectedModule === moduleVal ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedModule(prev => prev === moduleVal ? null : moduleVal); setPage(1); }}
              >
                {moduleVal}M
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Ampere - Circuit Protection */}
      {isCircuitProtection && availableAmperes.length > 0 && (
        <div className="space-y-3">
          <Label>Ampere</Label>
          <div className="flex flex-wrap gap-2">
            {availableAmperes.map(amp => (
              <Button
                key={amp.value}
                variant={selectedAmpere === amp.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedAmpere(prev => prev === amp.value ? null : amp.value); setPage(1); }}
              >
                {amp.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Wire Size */}
      {isWiresCategory && availableWireSizes.length > 0 && (
        <div className="space-y-3">
          <Label>Wire Size (sqmm)</Label>
          <div className="flex flex-wrap gap-2">
            {availableWireSizes.map(size => (
              <Button
                key={size}
                variant={selectedWireSize === size ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedWireSize(prev => prev === size ? null : size); setPage(1); }}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Core Count */}
      {isWiresCategory && availableCoreCounts.length > 0 && (
        <div className="space-y-3">
          <Label>Wire Core</Label>
          <div className="flex flex-wrap gap-2">
            {availableCoreCounts.map(core => (
              <Button
                key={core}
                variant={selectedCoreCount === core ? "secondary" : "outline"}
                size="sm"
                onClick={() => { setSelectedCoreCount(prev => prev === core ? null : core); setPage(1); }}
              >
                {core} Core
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={() => { clearFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SEOHead {...getCategorySEO(shoppingCategory.displayName, filteredProducts.length)} canonicalPath={`/category/${shoppingCategory.slug}`} />
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          {/* Category Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Link to="/categories" className="hover:text-accent transition-colors">Shop</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{shoppingCategory.displayName}</span>
            </div>

            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const IconComp = iconMap[shoppingCategory.id] || Package;
                  return <IconComp className="h-5 w-5 text-accent" />;
                })()}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1">
                  {shoppingCategory.displayName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {shoppingCategory.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sub-Section Tabs */}
          {shoppingCategory.subSections.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {shoppingCategory.subSections.map(tab => {
                  const isActive = activeTab === tab.id;
                  const count = tabCounts[tab.id] || 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                        isActive
                          ? "bg-accent text-white shadow-sm shadow-accent/20"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.name}
                      <span className={cn(
                        "ml-1",
                        isActive ? "opacity-80" : "opacity-50"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Brand + Model Visual Selector (prominent, above products) */}
          {(shoppingCategory?.slug === 'switches-sockets' || shoppingCategory?.slug === 'plates' || shoppingCategory?.slug === 'circuit-protection') && allProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <BrandModelSelector
                allProducts={allProducts}
                selectedBrands={selectedBrands}
                selectedSeries={selectedSeries}
                onBrandToggle={(brand) => {
                  setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
                  setSelectedSeries([]);
                  setPage(1);
                }}
                onSeriesToggle={(series) => {
                  setSelectedSeries(prev => prev.includes(series) ? [] : [series]);
                  setPage(1);
                }}
                onClearAll={() => {
                  setSelectedBrands([]);
                  setSelectedSeries([]);
                  setPage(1);
                }}
              />
            </motion.div>
          )}

          {/* Main Content */}
          <div className="flex gap-6">
            {/* Left Sidebar - Shopping Flow + Plate Wizard */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Shopping Flow Nav */}
                <div className="bg-card rounded-2xl border border-border/60 p-4">
                  <h2 className="text-[10px] font-bold mb-3 text-muted-foreground uppercase tracking-widest">
                    Shopping Flow
                  </h2>
                  <div className="space-y-0.5">
                    {SHOPPING_CATEGORIES.map((cat) => {
                      const isActive = cat.slug === slug;
                      const IconComp = iconMap[cat.id] || Package;
                      return (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group",
                            isActive
                              ? "bg-accent text-white font-semibold shadow-sm shadow-accent/20"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <IconComp className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            isActive ? "text-white" : "text-muted-foreground/60"
                          )} />
                          <span className="flex-1 text-xs truncate">{cat.displayName}</span>
                          <span className={cn(
                            "text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-secondary text-muted-foreground"
                          )}>
                            {cat.step}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Next Step CTA */}
                  {nextCategory && (
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <Link
                        to={`/category/${nextCategory.slug}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary hover:bg-accent/10 hover:text-accent transition-all text-xs font-medium"
                      >
                        <span className="text-muted-foreground">Next:</span>
                        <span className="font-semibold">{nextCategory.displayName}</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground group-hover:text-accent" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Plate Selection Wizard (only for Plates category) */}
                {slug === 'plates' && allProducts.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border/60 p-4">
                    <h2 className="text-[10px] font-bold mb-3 text-muted-foreground uppercase tracking-widest">
                      Find Your Plates
                    </h2>
                    <PlateSelectionWizard
                      allProducts={allProducts}
                      selectedBrand={selectedBrands[0] || null}
                      selectedSeries={selectedSeries[0] || null}
                      selectedColor={selectedColor}
                      onBrandSelect={(brand) => {
                        setSelectedBrands(brand ? [brand] : []);
                        setSelectedSeries([]);
                        setSelectedColor(null);
                        setPage(1);
                      }}
                      onSeriesSelect={(series) => {
                        setSelectedSeries(series ? [series] : []);
                        setSelectedColor(null);
                        setPage(1);
                      }}
                      onColorSelect={(color) => {
                        setSelectedColor(color === '__all__' ? null : color);
                        setPage(1);
                      }}
                      onClearAll={() => {
                        setSelectedBrands([]);
                        setSelectedSeries([]);
                        setSelectedColor(null);
                        setPage(1);
                      }}
                    />
                  </div>
                )}
              </div>
            </aside>

            {/* Right Side - Products */}
            <div className="flex-1 min-w-0">
              {/* Mobile Plate Wizard (inline, always visible for plates) */}
              {slug === 'plates' && allProducts.length > 0 && (
                <div className="lg:hidden mb-4 bg-card rounded-2xl border border-border/60 p-4">
                  <h2 className="text-[10px] font-bold mb-3 text-muted-foreground uppercase tracking-widest">
                    Find Your Plates
                  </h2>
                  <PlateSelectionWizard
                    allProducts={allProducts}
                    selectedBrand={selectedBrands[0] || null}
                    selectedSeries={selectedSeries[0] || null}
                    selectedColor={selectedColor}
                    onBrandSelect={(brand) => {
                      setSelectedBrands(brand ? [brand] : []);
                      setSelectedSeries([]);
                      setSelectedColor(null);
                      setPage(1);
                    }}
                    onSeriesSelect={(series) => {
                      setSelectedSeries(series ? [series] : []);
                      setSelectedColor(null);
                      setPage(1);
                    }}
                    onColorSelect={(color) => {
                      setSelectedColor(color === '__all__' ? null : color);
                      setPage(1);
                    }}
                    onClearAll={() => {
                      setSelectedBrands([]);
                      setSelectedSeries([]);
                      setSelectedColor(null);
                      setPage(1);
                    }}
                  />
                </div>
              )}

              {/* Mobile Tabs */}
              {shoppingCategory.subSections.length > 1 && (
                <div className="lg:hidden mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {shoppingCategory.subSections.map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={cn(
                            "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                            isActive
                              ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {tab.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mobile Categories */}
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
                        {SHOPPING_CATEGORIES.map(cat => {
                          const isActive = cat.slug === slug;
                          const IconComp = iconMap[cat.id] || Package;
                          return (
                            <Link
                              key={cat.id}
                              to={`/category/${cat.slug}`}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                isActive
                                  ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                              onClick={() => {}}
                            >
                              <IconComp className="h-4 w-4" />
                              <span className="text-sm">{cat.displayName}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>

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
                        {selectedBrands.length + selectedSeries.length + (selectedSubcategory ? 1 : 0) + (selectedColor ? 1 : 0) + (selectedModule ? 1 : 0) + (selectedAmpere ? 1 : 0) + (selectedWireSize ? 1 : 0) + (selectedCoreCount ? 1 : 0) + (selectedCapacity ? 1 : 0) + (localSearch ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>

                  {/* Mobile Filters */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 md:hidden">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                      </Button>
                    </SheetTrigger>                      <SheetContent side="left" className="w-80">
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
                      <motion.div key={brand} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => toggleBrand(brand)} className="gap-1.5">
                          {brand} <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                    {selectedSeries.map(series => (
                      <motion.div key={series} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => toggleSeries(series)} className="gap-1.5">
                          {series} <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                    {selectedColor && (
                      <motion.div key="color" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedColor(null)} className="gap-1.5">
                          {selectedColor} <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                    {selectedModule && (
                      <motion.div key="module" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedModule(null)} className="gap-1.5">
                          {selectedModule}M <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                    {selectedSubcategory && (
                      <motion.div key="subcategory" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedSubcategory(null)} className="gap-1.5">
                          {selectedSubcategory} <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                    {selectedCapacity && (
                      <motion.div key="capacity" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedCapacity(null)} className="gap-1.5">
                          {selectedCapacity}L <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value: SortOption) => { setSortBy(value); setPage(1); }}>
                    <SelectTrigger className="w-40 h-9 text-sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {(shoppingCategory?.slug === 'switches-sockets' || shoppingCategory?.slug === 'plates') && (
                        <SelectItem value="name-asc">Recommended</SelectItem>
                      )}
                      {shoppingCategory?.slug !== 'switches-sockets' && shoppingCategory?.slug !== 'plates' && (
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                      )}
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="price-asc">Price Low-High</SelectItem>
                      <SelectItem value="price-desc">Price High-Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </span>

                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setView('grid')}>
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setView('list')}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products with sidebar filters */}
              <div className="flex gap-6">
                {/* Desktop Filter Sidebar */}
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
                  {displayedProducts.length > 0 ? (
                    <div className={cn(
                      "grid gap-4",
                      view === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                    )}>
                      <AnimatePresence mode="popLayout">
                        {displayedProducts.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.5), duration: 0.3 }}
                          >
                            {/* First row is above the fold: it holds the real
                                LCP candidate, so it loads eagerly. */}
                            <ProductCard product={product} index={idx} priority={idx < 4} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground mb-4">
                        {allProducts.length === 0
                          ? 'No products in this category yet.'
                          : 'No products found matching your criteria'}
                      </p>
                      <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                    </div>
                  )}

                  {/* Load More */}
                  {hasMore && displayedProducts.length > 0 && (
                    <div className="mt-8 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={filterLoading}
                      >
                        {filterLoading ? 'Loading...' : `Load More (${filteredProducts.length - displayedProducts.length} remaining)`}
                      </Button>
                    </div>
                  )}

                  {/* End of results */}
                  {!hasMore && displayedProducts.length > 0 && (
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                      Showing all {displayedProducts.length} products
                    </div>
                  )}

                  {/* Next Step CTA */}
                  {nextCategory && displayedProducts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-12 p-6 rounded-2xl bg-secondary/50 border border-border/50 text-center"
                    >
                      <p className="text-muted-foreground mb-3">
                        {shoppingCategory.nextStepText}
                      </p>
                      <Link to={`/category/${nextCategory.slug}`}>
                        <Button className="gap-2">
                          Browse {nextCategory.displayName}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
