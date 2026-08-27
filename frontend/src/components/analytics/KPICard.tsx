import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PeriodComparison } from '@/api/analytics';

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  value: number | PeriodComparison;
  subtitle?: string;
  formatValue?: (v: number) => string;
  isLoading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  icon: Icon,
  value,
  subtitle,
  formatValue = (v) => v.toLocaleString(),
  isLoading,
  className,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const isPeriod = typeof value === 'object' && 'current' in value;
  const displayValue = isPeriod ? value.current : value;
  const trend = isPeriod ? value.trend : undefined;
  const change = isPeriod ? value.change : undefined;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(displayValue)}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {isPeriod && trend && change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <ArrowUp className="h-3 w-3 text-green-600" />}
            {trend === 'down' && <ArrowDown className="h-3 w-3 text-red-600" />}
            {trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground',
              )}
            >
              {Math.abs(change).toFixed(1)}% vs previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
