import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/lib/quotationPricing';
import { cn } from '@/lib/utils';
import type { QuotationProductRow } from '@/types/quotation';
import { AddQtyInput } from './AddQtyInput';

const QTY_PRESETS = [1, 5, 10, 25, 50];

interface ProductTableProps {
  products: QuotationProductRow[];
  total: number;
  loading?: boolean;
  fetching?: boolean;
  searchQuery?: string;
  debouncedSearch?: string;
  focusedIndex: number;
  onFocusIndexChange: (index: number) => void;
  onAdd: (product: QuotationProductRow, quantity: number) => void;
  cartQtyByProductId?: Record<string, number>;
  showCategoryColumn?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ProductTable({
  products,
  total,
  loading,
  fetching,
  searchQuery = '',
  debouncedSearch = '',
  focusedIndex,
  onFocusIndexChange,
  onAdd,
  cartQtyByProductId = {},
  showCategoryColumn = false,
  page,
  pageSize,
  onPageChange,
}: ProductTableProps) {
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const parentRef = useRef<HTMLDivElement>(null);

  const getQty = (id: string) => qtyById[id] ?? 1;
  const commitQty = useCallback((id: string, q: number) => {
    setQtyById((prev) => ({ ...prev, [id]: Math.max(1, q) }));
  }, []);

  const columns = useMemo<ColumnDef<QuotationProductRow>[]>(
    () => [
      { accessorKey: 'sku', header: 'Code', size: 110 },
      { accessorKey: 'name', header: 'Product Name', size: 280 },
      ...(showCategoryColumn
        ? [
            {
              accessorKey: 'category',
              header: 'Category',
              size: 100,
              cell: ({ getValue }: { getValue: () => unknown }) => getValue() || '—',
            } as ColumnDef<QuotationProductRow>,
          ]
        : []),
      { accessorKey: 'brand', header: 'Brand', size: 90 },
      {
        accessorKey: 'listPrice',
        header: 'LP',
        size: 90,
        cell: ({ getValue }) => formatInr(Number(getValue())),
      },
      {
        id: 'inCart',
        header: 'In bill',
        size: 72,
        cell: ({ row }) => {
          const inBill =
            cartQtyByProductId[row.original.id] ?? cartQtyByProductId[row.original.sku];
          if (!inBill) return <span className="text-muted-foreground">—</span>;
          return (
            <Badge variant="default" className="tabular-nums font-bold text-sm">
              {inBill}
            </Badge>
          );
        },
      },
      {
        id: 'qty',
        header: 'Add',
        size: 140,
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1.5"
            data-no-row-click
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <AddQtyInput
              productId={row.original.id}
              quantity={getQty(row.original.id)}
              onCommit={commitQty}
              onEnter={(qty) => onAdd(row.original, qty)}
            />
            <Button
              size="sm"
              className="h-10 px-3 text-sm font-semibold touch-manipulation"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onAdd(row.original, getQty(row.original.id));
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        ),
      },
    ],
    [qtyById, onAdd, cartQtyByProductId, showCategoryColumn, commitQty]
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const useVirtual = products.length > 100;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
    enabled: useVirtual,
  });

  useEffect(() => {
    const editing = document.activeElement?.closest('[data-product-qty-input]');
    if (editing) return;
    if (focusedIndex >= 0 && focusedIndex < rows.length && useVirtual) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, rows.length, useVirtual, virtualizer]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const searchPending = searchQuery.trim() !== debouncedSearch.trim();
  const isSearchActive = debouncedSearch.trim().length > 0;
  const showLoading = (loading || fetching || searchPending) && !products.length;

  if (showLoading) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground text-center pb-2">
          {searchPending || fetching ? `Searching “${searchQuery.trim()}”…` : 'Loading products…'}
        </p>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2 px-4 text-center">
        {isSearchActive ? (
          <>
            <p>No products found for &quot;{debouncedSearch.trim()}&quot;</p>
            <p className="text-xs">Try clearing filters or a shorter search term</p>
          </>
        ) : (
          <p>Type in the search box or adjust filters to find products</p>
        )}
      </div>
    );
  }

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    !!target.closest('input, button, a, [data-no-row-click], [data-product-qty-input]');

  const renderRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return null;
    const isFocused = rowIndex === focusedIndex;
    const inBill = cartQtyByProductId[row.original.id];
    return (
      <tr
        key={row.id}
        className={cn(
          'border-b cursor-pointer hover:bg-muted/50 transition-colors',
          isFocused && 'bg-accent/10 ring-1 ring-inset ring-accent/30',
          inBill && 'bg-green-500/5'
        )}
        onClick={(e) => {
          if (isInteractiveTarget(e.target)) return;
          onFocusIndexChange(rowIndex);
        }}
        onDoubleClick={(e) => {
          if (isInteractiveTarget(e.target)) return;
          onAdd(row.original, getQty(row.original.id));
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-2 py-2 text-sm align-middle">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex gap-1 px-3 py-1.5 border-b items-center">
        <span className="text-xs text-muted-foreground mr-2">Quick qty:</span>
        {QTY_PRESETS.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              const focused = products[focusedIndex];
              if (focused) commitQty(focused.id, q);
            }}
          >
            {q}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {fetching && !searchPending ? 'Updating… · ' : ''}
          {total} products · page {page}/{totalPages}
        </span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-2 py-2 text-left text-sm font-medium text-muted-foreground"
                    style={{ width: h.column.getSize() }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={useVirtual ? { height: `${virtualizer.getTotalSize()}px`, position: 'relative' } : undefined}
          >
            {useVirtual
              ? virtualizer.getVirtualItems().map((vRow) => (
                  <tr
                    key={rows[vRow.index]?.id ?? vRow.key}
                    className={cn(
                      'border-b cursor-pointer hover:bg-muted/50 absolute left-0 w-full table table-fixed',
                      vRow.index === focusedIndex && 'bg-accent/10',
                      products[vRow.index] &&
                        (cartQtyByProductId[products[vRow.index].id] ??
                          cartQtyByProductId[products[vRow.index].sku]) &&
                        'bg-green-500/5'
                    )}
                    style={{
                      height: `${vRow.size}px`,
                      transform: `translateY(${vRow.start}px)`,
                    }}
                    onClick={(e) => {
                      if (isInteractiveTarget(e.target)) return;
                      const product = products[vRow.index];
                      if (!product) return;
                      onFocusIndexChange(vRow.index);
                    }}
                    onDoubleClick={(e) => {
                      if (isInteractiveTarget(e.target)) return;
                      const product = products[vRow.index];
                      if (!product) return;
                      onAdd(product, getQty(product.id));
                    }}
                  >
                    {rows[vRow.index]?.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-2 text-sm align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((_, i) => renderRow(i))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 p-2 border-t">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
