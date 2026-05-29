import { cn } from '@/lib/utils';
import { ALL_CATEGORIES, type QuotationCategory } from '@/types/quotation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface CategorySidebarProps {
  categories: QuotationCategory[];
  selected: string | null;
  onSelect: (name: string) => void;
  loading?: boolean;
}

function CategoryButton({
  cat,
  selected,
  onSelect,
  emphasized,
}: {
  cat: QuotationCategory;
  selected: string | null;
  onSelect: (name: string) => void;
  emphasized?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cat.name)}
      className={cn(
        'w-full text-left px-3 py-3 rounded-md text-base transition-colors flex justify-between gap-2 min-h-[44px]',
        selected === cat.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        emphasized && 'font-semibold'
      )}
    >
      <span className="truncate">{cat.name}</span>
      <span
        className={cn(
          'text-xs tabular-nums shrink-0',
          selected === cat.name ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {cat.productCount}
      </span>
    </button>
  );
}

export function CategorySidebar({ categories, selected, onSelect, loading }: CategorySidebarProps) {
  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  const allCategory = categories.find((c) => c.name === ALL_CATEGORIES);
  const otherCategories = categories.filter((c) => c.name !== ALL_CATEGORIES);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Categories
        </p>
        {allCategory && (
          <CategoryButton
            cat={allCategory}
            selected={selected}
            onSelect={onSelect}
            emphasized
          />
        )}
        {allCategory && otherCategories.length > 0 && <div className="my-2 border-t" />}
        {otherCategories.map((cat) => (
          <CategoryButton key={cat.name} cat={cat} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </ScrollArea>
  );
}
