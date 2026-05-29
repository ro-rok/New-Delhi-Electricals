import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FacetField } from '@/types/quotation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  facets: FacetField[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  loading?: boolean;
  /** Renders inline inside a shared toolbar row (no outer border/padding). */
  inline?: boolean;
}

const triggerClass =
  'h-9 w-[128px] shrink-0 text-sm [&>span]:truncate';

export function FilterBar({
  facets,
  filters,
  onFilterChange,
  onClear,
  loading,
  inline,
}: FilterBarProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-[128px] shrink-0" />
        ))}
      </>
    );
  }

  if (!facets.length) return null;

  const selects = (
    <>
      {facets.map((facet) => (
        <Select
          key={facet.key}
          value={filters[facet.key] ?? '__all__'}
          onValueChange={(v) => onFilterChange(facet.key, v === '__all__' ? '' : v)}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder={facet.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All {facet.label}</SelectItem>
            {facet.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.value} ({opt.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2 text-sm"
          onClick={onClear}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </>
  );

  if (inline) return selects;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 p-3">
      {selects}
    </div>
  );
}

/** Search + filters on one row */
export function ProductSearchToolbar({
  searchRef,
  search,
  onSearchChange,
  facets,
  filters,
  onFilterChange,
  onClearFilters,
  facetsLoading,
  className,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (v: string) => void;
  facets: FacetField[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  facetsLoading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'shrink-0 flex items-center gap-2 border-b px-2 py-1.5 bg-muted/20 overflow-x-auto',
        className
      )}
    >
      <div className="relative w-[220px] shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={searchRef}
          data-product-search="true"
          type="search"
          placeholder="Search SKU or name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-8 text-sm"
        />
      </div>
      <FilterBar
        facets={facets}
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
        loading={facetsLoading}
        inline
      />
    </div>
  );
}
