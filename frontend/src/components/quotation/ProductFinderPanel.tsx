import { ProductSearchToolbar } from './FilterBar';
import { ProductTable } from './ProductTable';
import type { FacetField, QuotationProductRow } from '@/types/quotation';

interface ProductFinderPanelProps {
  searchRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (v: string) => void;
  facets: FacetField[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  facetsLoading?: boolean;
  onAdd: (product: QuotationProductRow, qty: number) => void;
  products: QuotationProductRow[];
  total: number;
  productsLoading?: boolean;
  productsFetching?: boolean;
  searchQuery?: string;
  debouncedSearch?: string;
  focusedIndex: number;
  onFocusIndexChange: (i: number) => void;
  cartQtyByProductId: Record<string, number>;
  showCategoryColumn: boolean;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export function ProductFinderPanel({
  searchRef,
  search,
  onSearchChange,
  facets,
  filters,
  onFilterChange,
  onClearFilters,
  facetsLoading,
  onAdd,
  products,
  total,
  productsLoading,
  productsFetching,
  searchQuery,
  debouncedSearch,
  focusedIndex,
  onFocusIndexChange,
  cartQtyByProductId,
  showCategoryColumn,
  page,
  pageSize,
  onPageChange,
}: ProductFinderPanelProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <ProductSearchToolbar
        searchRef={searchRef}
        search={search}
        onSearchChange={onSearchChange}
        facets={facets}
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        facetsLoading={facetsLoading}
      />

      <ProductTable
        products={products}
        total={total}
        loading={productsLoading}
        fetching={productsFetching}
        searchQuery={searchQuery}
        debouncedSearch={debouncedSearch}
        focusedIndex={focusedIndex}
        onFocusIndexChange={onFocusIndexChange}
        onAdd={onAdd}
        cartQtyByProductId={cartQtyByProductId}
        showCategoryColumn={showCategoryColumn}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
