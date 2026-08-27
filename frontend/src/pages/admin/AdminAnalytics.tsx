import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, MessageSquare, CheckCircle, FileText, Package, Zap, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/analytics/KPICard';
import { TimeseriesChart, type TimeseriesMetric } from '@/components/analytics/TimeseriesChart';
import { TopTable } from '@/components/analytics/TopTable';
import { FunnelBar } from '@/components/analytics/FunnelBar';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getTopProducts,
  getTopCategories,
  getAnalyticsFunnel,
  getBrandsBreakdown,
  type DateRangePreset,
  type RangeParams,
} from '@/api/analytics';

const TIMESERIES_METRICS: { key: TimeseriesMetric; label: string }[] = [
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'quotations', label: 'Quotations' },
];

const AdminAnalytics = () => {
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('7d');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [activeMetrics, setActiveMetrics] = useState<TimeseriesMetric[]>(['inquiries', 'quotations']);

  // Build shared params for all queries
  const rangeParams = useMemo<RangeParams>(() => {
    if (rangePreset === 'custom' && customStart && customEnd) {
      return {
        range: 'custom',
        customStart: customStart.toISOString(),
        customEnd: customEnd.toISOString(),
      };
    }
    return { range: rangePreset };
  }, [rangePreset, customStart, customEnd]);

  const queryOpts = { staleTime: 60_000, refetchOnWindowFocus: false };

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } =
    useQuery({ queryKey: ['nde-analytics-overview', rangeParams], queryFn: () => getAnalyticsOverview(rangeParams), ...queryOpts });

  const { data: timeseries, isLoading: timeseriesLoading, refetch: refetchTimeseries } =
    useQuery({ queryKey: ['nde-analytics-timeseries', rangeParams], queryFn: () => getAnalyticsTimeseries(rangeParams), ...queryOpts });

  const { data: topProducts, isLoading: topProductsLoading, refetch: refetchTopProducts } =
    useQuery({ queryKey: ['nde-analytics-top-products', rangeParams], queryFn: () => getTopProducts({ ...rangeParams, limit: 10 }), ...queryOpts });

  const { data: topCategories, isLoading: topCategoriesLoading, refetch: refetchTopCategories } =
    useQuery({ queryKey: ['nde-analytics-top-categories', rangeParams], queryFn: () => getTopCategories(rangeParams), ...queryOpts });

  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } =
    useQuery({ queryKey: ['nde-analytics-funnel', rangeParams], queryFn: () => getAnalyticsFunnel(rangeParams), ...queryOpts });

  const { data: brands, isLoading: brandsLoading, refetch: refetchBrands } =
    useQuery({ queryKey: ['nde-analytics-brands', rangeParams], queryFn: () => getBrandsBreakdown(rangeParams), ...queryOpts });

  const isAnyLoading = overviewLoading || timeseriesLoading || topProductsLoading || topCategoriesLoading || funnelLoading || brandsLoading;

  const handleRefresh = () => {
    refetchOverview();
    refetchTimeseries();
    refetchTopProducts();
    refetchTopCategories();
    refetchFunnel();
    refetchBrands();
  };

  const toggleMetric = (metric: TimeseriesMetric) => {
    setActiveMetrics((prev) =>
      prev.includes(metric)
        ? prev.length > 1 ? prev.filter((m) => m !== metric) : prev // keep at least one
        : [...prev, metric],
    );
  };

  // Shape data for TopTable
  const productsTableData = useMemo(
    () =>
      (topProducts ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        badge: [p.brand, p.category].filter(Boolean).join(' · '),
        primaryLabel: 'Times Quoted',
        primaryValue: p.timesQuoted,
        secondaryLabel: 'Total Qty',
        secondaryValue: p.totalQty,
      })),
    [topProducts],
  );

  const categoriesTableData = useMemo(
    () =>
      (topCategories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        primaryLabel: 'Times Quoted',
        primaryValue: c.timesQuoted,
        secondaryLabel: 'Unique Products',
        secondaryValue: c.uniqueProducts,
      })),
    [topCategories],
  );

  const brandsTableData = useMemo(
    () =>
      (brands ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        primaryLabel: 'Times Quoted',
        primaryValue: b.timesQuoted,
        secondaryLabel: 'Total Qty',
        secondaryValue: b.totalQty,
      })),
    [brands],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance overview across inquiries, quotations and catalogue
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker
            value={rangePreset}
            onChange={setRangePreset}
            startDate={customStart}
            endDate={customEnd}
            onCustomRangeChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
          />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isAnyLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI row — core counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Inquiries"
          icon={MessageSquare}
          value={overview?.inquiries ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="New Inquiries"
          icon={MessageSquare}
          value={overview?.newInquiries ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Resolved"
          icon={CheckCircle}
          value={overview?.resolvedInquiries ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Quotations"
          icon={FileText}
          value={overview?.quotations ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Total Products"
          icon={Package}
          value={overview?.totalProducts ?? 0}
          subtitle={`${overview?.activeProducts ?? 0} active`}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Admin Actions"
          icon={Zap}
          value={overview?.adminActions ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
      </div>

      {/* Conversion rate highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Resolution Rate"
          icon={TrendingUp}
          value={overview?.conversionRate ?? { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          subtitle="Resolved ÷ total inquiries"
          formatValue={(v) => `${typeof v === 'number' ? v.toFixed(1) : v}%`}
          isLoading={overviewLoading}
        />
      </div>

      {/* Timeseries chart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Activity Over Time</h2>
          {/* Metric toggles */}
          <Tabs value="" onValueChange={() => {}}>
            <TabsList>
              {TIMESERIES_METRICS.map(({ key, label }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  data-state={activeMetrics.includes(key) ? 'active' : 'inactive'}
                  onClick={() => toggleMetric(key)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <TimeseriesChart
          data={timeseries?.dataPoints ?? []}
          selectedMetrics={activeMetrics}
          isLoading={timeseriesLoading}
        />
      </div>

      {/* Funnel */}
      <FunnelBar stages={funnel?.stages ?? []} isLoading={funnelLoading} />

      {/* Top performers — 2-col grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <TopTable
          title="Top Products (by Quotations)"
          data={productsTableData}
          isLoading={topProductsLoading}
        />
        <TopTable
          title="Top Categories"
          data={categoriesTableData}
          isLoading={topCategoriesLoading}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TopTable
          title="Top Brands"
          data={brandsTableData}
          isLoading={brandsLoading}
        />
      </div>
    </div>
  );
};

export default AdminAnalytics;
