import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { FunnelStage } from '@/api/analytics';

interface FunnelBarProps {
  stages: FunnelStage[];
  isLoading?: boolean;
  className?: string;
}

const STAGE_COLORS = ['#0088FE', '#00C49F', '#FF8042', '#FFBB28'];

export function FunnelBar({ stages, isLoading, className }: FunnelBarProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-80 w-full" /></CardContent>
      </Card>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <Card className={className}>
        <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
            No funnel data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = stages.map((s) => ({ name: s.stage, count: s.count }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-50" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Count']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stage detail rows */}
        <div className="mt-4 space-y-2">
          {stages.map((s, i) => (
            <div key={s.stage} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }}
                />
                <span className="font-medium">{s.stage}</span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <span className="text-muted-foreground">{s.count.toLocaleString()}</span>
                {i > 0 && (
                  <span
                    className={
                      s.conversionRate >= 50
                        ? 'text-green-600 font-medium'
                        : 'text-orange-500 font-medium'
                    }
                  >
                    {s.conversionRate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
