import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuotationsList } from '@/api/quotations';
import { formatInr } from '@/lib/quotationPricing';
import { Skeleton } from '@/components/ui/skeleton';

const AdminQuotationsList = () => {
  const { data, isLoading } = useQuotationsList();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground mt-1">Browse and open saved quotations</p>
        </div>
        <Button asChild>
          <Link to="/admin/quotation-maker">
            <Plus className="h-4 w-4 mr-2" />
            New quotation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-3"
        >
          {(data?.items ?? []).map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-mono font-medium">{q.quotationNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {q.customer.name || 'No customer'} · {q.items.length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={q.status === 'final' ? 'default' : 'secondary'}>{q.status}</Badge>
                  <span className="font-semibold">{formatInr(q.pricing.grandTotal)}</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/quotation-maker?id=${q.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(data?.items ?? []).length === 0 && (
            <p className="text-center text-muted-foreground py-12">No quotations yet</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminQuotationsList;
