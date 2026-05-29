import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuotationCustomer } from '@/types/quotation';

interface CustomerFormProps {
  customer: QuotationCustomer;
  onChange: (customer: QuotationCustomer) => void;
}

export function CustomerForm({ customer, onChange }: CustomerFormProps) {
  const set = (field: keyof QuotationCustomer, value: string) => {
    onChange({ ...customer, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="cust-name" className="text-sm font-medium">
            Customer name
          </Label>
          <Input
            id="cust-name"
            value={customer.name}
            onChange={(e) => set('name', e.target.value)}
            className="h-11 text-base mt-1"
            placeholder="Enter customer name"
          />
        </div>
        <div>
          <Label htmlFor="cust-phone" className="text-sm font-medium">
            Phone
          </Label>
          <Input
            id="cust-phone"
            value={customer.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="h-11 text-base mt-1"
            placeholder="Mobile number"
          />
        </div>
        <div>
          <Label htmlFor="cust-gst" className="text-sm font-medium">
            GST number
          </Label>
          <Input
            id="cust-gst"
            value={customer.gstNumber}
            onChange={(e) => set('gstNumber', e.target.value)}
            className="h-11 text-base mt-1"
            placeholder="Optional"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cust-addr" className="text-sm font-medium">
            Address
          </Label>
          <Textarea
            id="cust-addr"
            value={customer.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            className="text-base mt-1 resize-none"
            placeholder="Delivery / billing address"
          />
        </div>
      </div>
    </div>
  );
}
