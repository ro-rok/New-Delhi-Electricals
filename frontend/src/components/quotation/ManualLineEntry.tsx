import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'name' | 'qty' | 'rate' | 'disc';

interface ManualLineEntryProps {
  onAdd: (params: {
    name: string;
    quantity: number;
    listPrice: number;
    itemDiscountPct: number;
  }) => string;
  onAdded?: (productId: string) => void;
}

export function ManualLineEntry({ onAdd, onAdded }: ManualLineEntryProps) {
  const [step, setStep] = useState<Step>('idle');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');
  const [disc, setDisc] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const discRef = useRef<HTMLInputElement>(null);

  const startEntry = () => {
    setName('');
    setQty('1');
    setRate('');
    setDisc('');
    setStep('name');
  };

  useEffect(() => {
    if (step === 'name') nameRef.current?.focus();
    if (step === 'qty') qtyRef.current?.focus();
    if (step === 'rate') rateRef.current?.focus();
    if (step === 'disc') discRef.current?.focus();
  }, [step]);

  const commit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setStep('idle');
      return;
    }
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    const listPrice = Math.max(0, parseFloat(rate) || 0);
    const itemDiscountPct =
      disc.trim() === '' ? 0 : Math.min(100, Math.max(0, parseFloat(disc) || 0));
    const id = onAdd({ name: trimmedName, quantity, listPrice, itemDiscountPct });
    onAdded?.(id);
    setName('');
    setQty('1');
    setRate('');
    setDisc('');
    setStep('name');
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [name, qty, rate, disc, onAdd, onAdded]);

  const handleNameKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!name.trim()) return;
    setStep('qty');
  };

  const handleQtyKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    setQty(String(Math.max(1, parseInt(qty, 10) || 1)));
    setStep('rate');
  };

  const handleRateKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    setStep('disc');
  };

  const handleDiscKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commit();
  };

  if (step === 'idle') {
    return (
      <tr className="bg-[#f5f9ff]">
        <td colSpan={9} className="border border-[#8ca0b3] px-3 py-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 border-dashed border-[#8ca0b3] text-[#1a3a5c] font-medium"
            onClick={startEntry}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add item not in catalogue
          </Button>
        </td>
      </tr>
    );
  }

  const labelClass = 'text-xs font-semibold text-[#1a3a5c] shrink-0 w-16';

  return (
    <tr className="bg-[#fff9c4]">
      <td colSpan={9} className="border border-[#8ca0b3] p-3">
        <p className="text-xs font-semibold text-[#1a5276] mb-2">
          Custom line — Enter after each field · blank discount + Enter = 0%
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[200px] flex-1">
            <span className={labelClass}>Name</span>
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKey}
              placeholder="Product description"
              className={cn(
                'h-10 text-base border-[#8ca0b3] rounded-none',
                step === 'name' && 'ring-2 ring-primary'
              )}
            />
          </div>
          <div className="flex flex-col gap-1 w-20">
            <span className={labelClass}>Qty</span>
            <Input
              ref={qtyRef}
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={handleQtyKey}
              disabled={step === 'name'}
              className={cn(
                'h-10 text-center font-semibold border-[#8ca0b3] rounded-none',
                step === 'qty' && 'ring-2 ring-primary'
              )}
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <span className={labelClass}>List rate ₹</span>
            <Input
              ref={rateRef}
              type="number"
              min={0}
              step={0.01}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onKeyDown={handleRateKey}
              disabled={step === 'name' || step === 'qty'}
              placeholder="0"
              className={cn(
                'h-10 text-right font-semibold border-[#8ca0b3] rounded-none',
                step === 'rate' && 'ring-2 ring-primary'
              )}
            />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <span className={labelClass}>Disc %</span>
            <Input
              ref={discRef}
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={disc}
              onChange={(e) => setDisc(e.target.value)}
              onKeyDown={handleDiscKey}
              disabled={step !== 'disc'}
              placeholder="0"
              className={cn(
                'h-10 text-center font-semibold border-[#8ca0b3] rounded-none',
                step === 'disc' && 'ring-2 ring-primary'
              )}
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep('idle')}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}
