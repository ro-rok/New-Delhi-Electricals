import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopTableRow {
  id: string;
  name: string;
  /** primary metric column label */
  primaryLabel: string;
  primaryValue: number;
  /** secondary metric column label */
  secondaryLabel: string;
  secondaryValue: number;
  /** optional badge text (brand, category, etc.) */
  badge?: string;
}

interface TopTableProps {
  title: string;
  data: TopTableRow[];
  isLoading?: boolean;
  className?: string;
}

type SortDir = 'asc' | 'desc';

export function TopTable({ title, data, isLoading, className }: TopTableProps) {
  const [sortBy, setSortBy] = useState<'primary' | 'secondary'>('primary');
  const [dir, setDir] = useState<SortDir>('desc');

  const toggleSort = (col: 'primary' | 'secondary') => {
    if (sortBy === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = sortBy === 'primary' ? a.primaryValue : a.secondaryValue;
    const bv = sortBy === 'primary' ? b.primaryValue : b.secondaryValue;
    return dir === 'asc' ? av - bv : bv - av;
  });

  const exportCSV = () => {
    if (!data.length) return;
    const header = ['Rank', 'Name', data[0].primaryLabel, data[0].secondaryLabel];
    const rows = sorted.map((r, i) => [i + 1, r.name, r.primaryValue, r.secondaryValue]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            No data available for the selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  const primaryLabel = data[0]?.primaryLabel ?? 'Primary';
  const secondaryLabel = data[0]?.secondaryLabel ?? 'Secondary';

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium w-10">#</th>
              <th className="text-left p-2 font-medium">Name</th>
              <th
                className="text-right p-2 font-medium cursor-pointer hover:bg-muted/50 rounded"
                onClick={() => toggleSort('primary')}
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  {primaryLabel}
                  <ArrowUpDown className={cn('h-3 w-3', sortBy === 'primary' ? 'opacity-100' : 'opacity-40')} />
                </span>
              </th>
              <th
                className="text-right p-2 font-medium cursor-pointer hover:bg-muted/50 rounded"
                onClick={() => toggleSort('secondary')}
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  {secondaryLabel}
                  <ArrowUpDown className={cn('h-3 w-3', sortBy === 'secondary' ? 'opacity-100' : 'opacity-40')} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </div>
                </td>
                <td className="p-2">
                  <div className="font-medium leading-tight">{row.name}</div>
                  {row.badge && (
                    <div className="text-xs text-muted-foreground mt-0.5">{row.badge}</div>
                  )}
                </td>
                <td className="p-2 text-right font-medium">{row.primaryValue.toLocaleString()}</td>
                <td className="p-2 text-right text-muted-foreground">{row.secondaryValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
