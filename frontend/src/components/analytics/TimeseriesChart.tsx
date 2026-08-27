import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeseriesDataPoint } from '@/api/analytics';

export type TimeseriesMetric = 'inquiries' | 'resolved' | 'quotations';

interface TimeseriesChartProps {
  data: TimeseriesDataPoint[];
  selectedMetrics: TimeseriesMetric[];
  isLoading?: boolean;
  className?: string;
}

const METRIC_COLORS: Record<TimeseriesMetric, string> = {
  inquiries: '#0088FE',
  resolved: '#00C49F',
  quotations: '#FF8042',
};

const METRIC_LABELS: Record<TimeseriesMetric, string> = {
  inquiries: 'Inquiries',
  resolved: 'Resolved',
  quotations: 'Quotations',
};

export function TimeseriesChart({
  data,
  selectedMetrics,
  isLoading,
  className,
}: TimeseriesChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatted = data.map((pt) => ({
    ...pt,
    date: new Date(pt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[metric]}
                name={METRIC_LABELS[metric]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
