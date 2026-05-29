import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useSaveQuotation } from '@/api/quotations';
import type { QuotationCreatePayload } from '@/types/quotation';

export function useQuotationAutosave(
  enabled: boolean,
  quotationId: string | null,
  buildPayload: () => QuotationCreatePayload,
  onSaved: (id: string) => void,
  dirty: boolean,
  markClean: () => void
) {
  const saveMutation = useSaveQuotation();
  const savingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !dirty) return;

    const timer = setInterval(async () => {
      if (savingRef.current) return;
      const payload = buildPayload();
      if (payload.items.length === 0 && !quotationId) return;

      savingRef.current = true;
      try {
        const result = await saveMutation.mutateAsync({ id: quotationId, payload });
        onSaved(result.id);
        markClean();
        toast.success('Draft auto-saved', { duration: 2000 });
      } catch {
        toast.error('Auto-save failed');
      } finally {
        savingRef.current = false;
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [enabled, dirty, quotationId, buildPayload, onSaved, markClean, saveMutation]);
}
