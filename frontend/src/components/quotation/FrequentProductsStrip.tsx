import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInr } from '@/lib/quotationPricing';
import type { FrequentProduct, QuotationProductRow } from '@/types/quotation';

interface FrequentProductsStripProps {
  title: string;
  products: Array<FrequentProduct | QuotationProductRow>;
  onAdd: (product: QuotationProductRow) => void;
}

function toProductRow(p: FrequentProduct | QuotationProductRow): QuotationProductRow {
  if ('id' in p && p.id) {
    return p as QuotationProductRow;
  }
  const f = p as FrequentProduct;
  return {
    id: f.productId,
    sku: f.sku,
    name: f.name,
    brand: f.brand,
    listPrice: f.listPrice,
    specs: {},
  };
}

export function FrequentProductsStrip({ title, products, onAdd }: FrequentProductsStripProps) {
  if (!products.length) return null;

  return (
    <div className="px-3 py-2 border-b bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {products.map((p) => {
          const row = toProductRow(p);
          return (
            <Button
              key={row.id}
              variant="outline"
              size="sm"
              className="shrink-0 h-auto py-1.5 px-2 text-left flex flex-col items-start max-w-[200px]"
              onClick={() => onAdd(row)}
            >
              <span className="text-xs font-medium truncate w-full">{row.sku}</span>
              <span className="text-[10px] text-muted-foreground truncate w-full">{row.name}</span>
              <span className="text-[10px] flex items-center gap-1 mt-0.5">
                {formatInr(row.listPrice)}
                <Plus className="h-3 w-3" />
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
