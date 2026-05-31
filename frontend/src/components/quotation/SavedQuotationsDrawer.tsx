import { useState } from 'react';
import { Copy, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatInr } from '@/lib/quotationPricing';
import type { Quotation } from '@/types/quotation';

interface SavedQuotationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotations: Quotation[];
  loading?: boolean;
  onLoad: (q: Quotation) => void | Promise<void>;
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
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpen = async (q: Quotation) => {
    if (openingId) return;
    setOpeningId(q.id);
    try {
      await onLoad(q);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col max-h-[100dvh]">
        <SheetHeader className="shrink-0 pr-10">
          <SheetTitle>Saved quotations</SheetTitle>
          <SheetDescription>Open a draft to edit or duplicate an existing quote.</SheetDescription>
        </SheetHeader>
        {/* Native scroll — Radix ScrollArea often blocks taps on iOS/Android */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain mt-4 -mx-1 px-1 touch-pan-y">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No quotations yet</p>
          ) : (
            <div className="space-y-3 pb-6">
              {quotations.map((q) => {
                const isOpening = openingId === q.id;
                const isBusy = isOpening || duplicatingId === q.id;
                return (
                  <div
                    key={q.id}
                    role="button"
                    tabIndex={0}
                    className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 active:bg-muted/50 transition-colors touch-manipulation cursor-pointer"
                    onClick={() => !isBusy && void handleOpen(q)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isBusy) void handleOpen(q);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 pointer-events-none">
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
                    <p className="text-sm font-medium pointer-events-none">
                      {formatInr(q.pricing.grandTotal)}
                    </p>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="default"
                        className="flex-1 min-h-11 touch-manipulation"
                        disabled={isBusy}
                        onClick={() => void handleOpen(q)}
                      >
                        {isOpening ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 min-w-11 touch-manipulation"
                        disabled={isBusy}
                        onClick={() => onDuplicate(q.id)}
                      >
                        {duplicatingId === q.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
