import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddQtyInputProps {
  productId: string;
  quantity: number;
  onCommit: (productId: string, quantity: number) => void;
  /** Called on Enter after qty is committed — use to add line and jump to discount */
  onEnter?: (quantity: number) => void;
  className?: string;
}

/** Qty field for product finder — drafts locally; Enter commits + adds; blur only commits. */
export function AddQtyInput({
  productId,
  quantity,
  onCommit,
  onEnter,
  className,
}: AddQtyInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const parseQty = (raw: string) => Math.max(1, parseInt(raw, 10) || 1);

  const commit = (raw: string) => {
    const v = parseQty(raw);
    onCommit(productId, v);
    setEditing(false);
    setDraft('');
    return v;
  };

  return (
    <Input
      type="number"
      min={1}
      inputMode="numeric"
      data-no-row-click
      data-product-qty-input={productId}
      className={cn(
        'h-10 w-16 text-sm px-1 text-center font-semibold touch-manipulation',
        editing && 'ring-2 ring-primary/40',
        className
      )}
      value={editing ? draft : String(quantity)}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => {
        e.stopPropagation();
        setEditing(true);
        setDraft(String(quantity));
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (!editing) return;
        commit(draft);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const v = commit(draft);
        onEnter?.(v);
        (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
