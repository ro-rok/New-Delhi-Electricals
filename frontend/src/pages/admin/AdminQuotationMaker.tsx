import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Printer,
  Save,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProductFinderPanel } from '@/components/quotation/ProductFinderPanel';
import { QuotationPanel } from '@/components/quotation/QuotationPanel';
import { formatInr } from '@/lib/quotationPricing';
import { ALL_CATEGORIES, type QuotationProductRow } from '@/types/quotation';
import { SavedQuotationsDrawer } from '@/components/quotation/SavedQuotationsDrawer';
import {
  downloadQuotationPdf,
  duplicateQuotation,
  useQuotation,
  useQuotationFacets,
  useQuotationProducts,
  useQuotationsList,
  useSaveQuotation,
} from '@/api/quotations';
import { useQuotationMaker } from '@/hooks/quotation/useQuotationMaker';
import { useQuotationAutosave } from '@/hooks/quotation/useQuotationAutosave';
import { useQuotationKeyboard } from '@/hooks/quotation/useQuotationKeyboard';
import type { Quotation, QuotationCreatePayload, QuotationStatus } from '@/types/quotation';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const AdminQuotationMaker = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const maker = useQuotationMaker();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState<string | undefined>();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [productPanelMinimized, setProductPanelMinimized] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const billScrollRef = useRef<HTMLDivElement>(null);

  const cartQtyByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of maker.cart) {
      if (item.productId) map[item.productId] = item.quantity;
      if (item.sku) map[item.sku] = item.quantity;
    }
    return map;
  }, [maker.cart]);
  const totalUnits = useMemo(
    () => maker.cart.reduce((s, i) => s + i.quantity, 0),
    [maker.cart]
  );

  useEffect(() => {
    if (!lastAddedId) return;
    const t = setTimeout(() => setLastAddedId(null), 2500);
    return () => clearTimeout(t);
  }, [lastAddedId]);

  const handleAddProduct = useCallback(
    (product: QuotationProductRow, quantity: number) => {
      const prevQty = cartQtyByProductId[product.id] ?? 0;
      maker.addProduct(product, quantity);
      setLastAddedId(product.id);
      const newTotal = prevQty + quantity;
      toast.success(`Added to bill: ${product.sku}`, {
        description: `${product.name.slice(0, 50)}${product.name.length > 50 ? '…' : ''} · Qty ${quantity} · In bill: ${newTotal}`,
        duration: 2200,
      });
    },
    [maker, cartQtyByProductId]
  );

  useEffect(() => {
    if (!lastAddedId || !billScrollRef.current) return;
    const el = billScrollRef.current.querySelector(`[data-cart-id="${lastAddedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lastAddedId, maker.cart.length]);

  const browseCategory = maker.filters.product_category || ALL_CATEGORIES;

  const browseFilters = useMemo(() => {
    if (browseCategory === ALL_CATEGORIES) return maker.filters;
    const { product_category: _, ...rest } = maker.filters;
    return rest;
  }, [maker.filters, browseCategory]);

  const { data: facets = [], isLoading: facetsLoading } = useQuotationFacets(
    browseCategory,
    browseFilters
  );
  const { data: productData, isLoading: productsLoading } = useQuotationProducts(
    browseCategory,
    browseFilters,
    debouncedSearch,
    page,
    50
  );
  const { data: savedList, isLoading: listLoading } = useQuotationsList();
  const { data: loadedQuotation } = useQuotation(editId);
  const saveMutation = useSaveQuotation();

  useEffect(() => {
    setPage(1);
    setFocusedIndex(0);
  }, [browseCategory, maker.filters, debouncedSearch]);

  useEffect(() => {
    if (!loadedQuotation) return;
    maker.loadQuotation({
      id: loadedQuotation.id,
      items: loadedQuotation.items,
      customer: loadedQuotation.customer,
      overallDiscountPct: loadedQuotation.pricing.overallDiscountPct,
      gstMode: loadedQuotation.pricing.gstMode,
      gstRate: loadedQuotation.pricing.gstRate,
      status: loadedQuotation.status,
      notes: loadedQuotation.notes ?? null,
    });
    setQuotationNumber(loadedQuotation.quotationNumber);
    maker.setQuotationId(loadedQuotation.id);
  }, [loadedQuotation?.id]);

  const buildPayload = useCallback(
    (): QuotationCreatePayload => ({
      status: maker.status,
      customer: maker.customer,
      items: maker.cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        itemDiscountPct: i.itemDiscountPct,
        manualUnitPrice: i.manualUnitPrice,
        ...(i.isManual
          ? {
              isManual: true,
              name: i.name,
              listPrice: i.listPrice,
              brand: i.brand,
              sku: i.sku,
            }
          : {}),
      })),
      overallDiscountPct: maker.overallDiscountPct,
      gstMode: maker.gstMode,
      gstRate: maker.gstRate,
      notes: maker.notes,
    }),
    [maker]
  );

  useQuotationAutosave(
    maker.status === 'draft',
    maker.quotationId,
    buildPayload,
    (id) => {
      maker.setQuotationId(id);
      if (!editId) setSearchParams({ id });
    },
    maker.dirty,
    maker.markClean
  );

  const products = productData?.items ?? [];

  const handleSave = async (status?: QuotationStatus) => {
    try {
      const payload = buildPayload();
      if (status) payload.status = status;
      const result = await saveMutation.mutateAsync({
        id: maker.quotationId,
        payload,
      });
      maker.setQuotationId(result.id);
      setQuotationNumber(result.quotationNumber);
      if (status) maker.setStatus(status);
      maker.markClean();
      setSearchParams({ id: result.id });
      toast.success(status === 'final' ? 'Quotation finalized' : 'Draft saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const handleNew = () => {
    maker.resetCart();
    maker.setQuotationId(null);
    setQuotationNumber(undefined);
    maker.setStatus('draft');
    maker.markClean();
    setSearchParams({});
  };

  const handleLoad = (q: Quotation) => {
    maker.loadQuotation({
      id: q.id,
      items: q.items,
      customer: q.customer,
      overallDiscountPct: q.pricing.overallDiscountPct,
      gstMode: q.pricing.gstMode,
      gstRate: q.pricing.gstRate,
      status: q.status,
      notes: q.notes ?? null,
    });
    setQuotationNumber(q.quotationNumber);
    setSearchParams({ id: q.id });
    setDrawerOpen(false);
    toast.success(`Loaded ${q.quotationNumber}`);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const copy = await duplicateQuotation(id);
      handleLoad(copy);
      toast.success('Duplicated as new draft');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Duplicate failed');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handlePdf = async () => {
    if (!maker.quotationId) {
      toast.error('Save the quotation first');
      return;
    }
    try {
      const blob = await downloadQuotationPdf(maker.quotationId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotationNumber ?? 'quotation'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed');
    }
  };

  const handlePrint = () => window.print();

  useQuotationKeyboard({
    onFocusSearch: () => searchRef.current?.focus(),
    onSave: () => handleSave(),
    onClearSearch: () => setSearch(''),
    onRowDown: () => setFocusedIndex((i) => Math.min(i + 1, products.length - 1)),
    onRowUp: () => setFocusedIndex((i) => Math.max(i - 1, 0)),
    onAddFocused: () => {
      const p = products[focusedIndex];
      if (p) handleAddProduct(p, 1);
    },
  });

  const savedQuotations = savedList?.items ?? [];

  return (
    <div className="quotation-maker-page flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-background shrink-0 print:hidden"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotation Maker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tally-style bill on top · Minimise product search below when done adding
          </p>
          {maker.cart.length > 0 && (
            <p className="text-sm font-semibold text-primary mt-1 tabular-nums">
              Bill: {totalUnits} units · {maker.cart.length} products ·{' '}
              {formatInr(maker.pricing.grandTotal)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            New bill
          </Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Open saved
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          <Button onClick={() => handleSave('final')} disabled={saveMutation.isPending}>
            <FileText className="h-4 w-4 mr-2" />
            Finalize
          </Button>
          <Button variant="outline" onClick={handlePdf} disabled={!maker.quotationId}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Bill — grows with items; full content prints (no scroll clip) */}
        <div
          ref={billScrollRef}
          className="flex-1 min-h-0 overflow-y-auto border-b print-quotation-panel print:overflow-visible print:h-auto print:flex-none print:max-h-none print:border-0"
        >
          <QuotationPanel
            cart={maker.cart}
            customer={maker.customer}
            pricing={maker.pricing}
            overallDiscountPct={maker.overallDiscountPct}
            gstMode={maker.gstMode}
            gstRate={maker.gstRate}
            quotationNumber={quotationNumber}
            lastAddedId={lastAddedId}
            onCustomerChange={(c) => {
              maker.setCustomer(c);
              maker.setDirty(true);
            }}
            onUpdateItem={maker.updateCartItem}
            onRemoveItem={maker.removeCartItem}
            onAddManualItem={(params) => {
              const id = maker.addManualItem(params);
              setLastAddedId(id);
              toast.success('Custom item added', { description: params.name, duration: 1800 });
              return id;
            }}
            onManualItemAdded={(id) => {
              setLastAddedId(id);
              if (billScrollRef.current) {
                billScrollRef.current.querySelector(`[data-cart-id="${id}"]`)?.scrollIntoView({
                  block: 'nearest',
                  behavior: 'smooth',
                });
              }
            }}
            onAfterDiscountEnter={() => {
              if (productPanelMinimized) setProductPanelMinimized(false);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
            onOverallDiscountChange={(v) => {
              maker.setOverallDiscountPct(v);
              maker.setDirty(true);
            }}
            onGstModeChange={(v) => {
              maker.setGstMode(v);
              maker.setDirty(true);
            }}
            onGstRateChange={(v) => {
              maker.setGstRate(v);
              maker.setDirty(true);
            }}
          />
        </div>

        {/* Product finder — expand / minimise to bottom bar */}
        {productPanelMinimized ? (
          <button
            type="button"
            onClick={() => setProductPanelMinimized(false)}
            className="shrink-0 flex items-center justify-between gap-3 w-full px-4 py-3 border-t bg-muted/40 hover:bg-muted/60 transition-colors print:hidden text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">Find &amp; add products</span>
              {search && (
                <span className="text-xs text-muted-foreground truncate">
                  · &quot;{search}&quot;
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
              Expand
              <ChevronUp className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <div className="h-[min(52vh,560px)] min-h-[340px] shrink-0 flex flex-col print:hidden border-t">
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b bg-muted/30 shrink-0">
              <span className="text-sm font-semibold">Find &amp; add products</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setProductPanelMinimized(true)}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Minimise
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <ProductFinderPanel
                searchRef={searchRef}
                search={search}
                onSearchChange={setSearch}
                facets={facets}
                filters={maker.filters}
                onFilterChange={(k, v) => maker.setFilter(k, v)}
                onClearFilters={maker.clearFilters}
                facetsLoading={facetsLoading}
                onAdd={handleAddProduct}
                products={products}
                total={productData?.total ?? 0}
                productsLoading={productsLoading}
                focusedIndex={focusedIndex}
                onFocusIndexChange={setFocusedIndex}
                cartQtyByProductId={cartQtyByProductId}
                showCategoryColumn={browseCategory === ALL_CATEGORIES}
                page={page}
                pageSize={50}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>

      <SavedQuotationsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        quotations={savedQuotations}
        loading={listLoading}
        onLoad={handleLoad}
        onDuplicate={handleDuplicate}
        duplicatingId={duplicatingId}
      />
    </div>
  );
};

export default AdminQuotationMaker;
