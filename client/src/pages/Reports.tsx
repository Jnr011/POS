import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportsRepository } from '../db/repository';
import { activityLogger } from '../db/activityLogger';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/reports/MetricCard';
import { SalesTrendChart } from '../components/reports/SalesTrendChart';
import { TopProductsTable } from '../components/reports/TopProductsTable';
import { PaymentBreakdown } from '../components/reports/PaymentBreakdown';
import { PeriodSelector } from '../components/reports/PeriodSelector';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { DollarSign, ShoppingCart, TrendingUp, Package, ClipboardList } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { format } from 'date-fns';
import type { DateRange, ReportSummary, SalesTrendPoint, ProductPerformance, PaymentBreakdown as PaymentBreakdownType, ActivityLogEntry } from '../types/reports';

function Reports() {
  const navigate = useNavigate();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [period, setPeriod] = useState<DateRange>({
    from: monthStart,
    to: now,
    label: `${monthStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    preset: 'this_month',
  });

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdownType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [s, t, p, pb, logs] = await Promise.all([
          ReportsRepository.getReportSummary(period.from, period.to),
          ReportsRepository.getSalesTrend(period.preset, period.from, period.to),
          ReportsRepository.getProductPerformance(period.from, period.to, 5),
          ReportsRepository.getPaymentBreakdown(period.from, period.to),
          activityLogger.getLogs(undefined, undefined, undefined, 10),
        ]);
        if (!cancelled) {
          setSummary(s);
          setTrend(t);
          setTopProducts(p);
          setPaymentBreakdown(pb);
          setActivityLogs(logs);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period]);

  if (loading && !summary) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<TrendingUp className="size-4 text-primary" />}
        title="Reports"
        description="Sales and inventory analytics"
      />

      <div data-tour="reports-period">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div data-tour="reports-metrics" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<DollarSign className="size-4" />}
          label="Total Revenue"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          change={summary?.revenueChange}
          accent="bg-chart-1"
        />
        <MetricCard
          icon={<ShoppingCart className="size-4" />}
          label="Total Orders"
          value={summary?.totalOrders ?? 0}
          change={summary?.ordersChange}
          accent="bg-chart-2"
        />
        <MetricCard
          icon={<TrendingUp className="size-4" />}
          label="Avg Order Value"
          value={formatCurrency(summary?.avgOrderValue ?? 0)}
          accent="bg-chart-3"
        />
        <MetricCard
          icon={<Package className="size-4" />}
          label="Quick Links"
          value="→"
          accent="bg-chart-5"
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/reports/sales')}
        />
      </div>

      <div data-tour="reports-charts" className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SalesTrendChart data={trend} />
          <TopProductsTable data={topProducts} />
        </div>
        <div className="space-y-6">
          <PaymentBreakdown data={paymentBreakdown} />

          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Latest 10</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {activityLogs.length === 0 ? (
                <EmptyState
                  compact
                  icon={<ClipboardList className="size-4 text-muted-foreground/50" />}
                  title="No activity yet"
                  description="Actions will appear here as they happen"
                />
              ) : (
                <div className="space-y-3 flex-1">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 group">
                      <div className="mt-1 size-1.5 rounded-full bg-primary/60 shrink-0 group-hover:bg-primary transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug">
                          <span className="font-medium">{log.userName}</span>
                          {' '}
                          <span className="text-muted-foreground">{log.action}</span>
                        </p>
                        {log.details && (
                          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                            {typeof log.details === 'string'
                              ? log.details
                              : Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Reports;
