import { Copy, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatInr } from '@/lib/quotationPricing';
import type { Quotation } from '@/types/quotation';

interface SavedQuotationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotations: Quotation[];
  loading?: boolean;
  onLoad: (q: Quotation) => void;
  onDuplicate: (id: string) => void;
  duplicatingId?: string | null;
}

export function SavedQuotationsDrawer({
  open,
  onOpenChange,
  quotations,
  loading,
  onLoad,
  onDuplicate,
  duplicatingId,
}: SavedQuotationsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Saved quotations</SheetTitle>
          <SheetDescription>Open a draft to edit or duplicate an existing quote.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No quotations yet</p>
          ) : (
            <div className="space-y-2 pr-4">
              {quotations.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium">{q.quotationNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.customer.name || 'No customer'} · {q.items.length} items
                      </p>
                    </div>
                    <Badge variant={q.status === 'final' ? 'default' : 'secondary'}>
                      {q.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{formatInr(q.pricing.grandTotal)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1" onClick={() => onLoad(q)}>
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={duplicatingId === q.id}
                      onClick={() => onDuplicate(q.id)}
                    >
                      {duplicatingId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
