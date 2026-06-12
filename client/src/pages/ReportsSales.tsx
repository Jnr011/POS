import { useState, useEffect } from 'react';
import { ReportsRepository } from '../db/repository';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/reports/MetricCard';
import { SalesTrendChart } from '../components/reports/SalesTrendChart';
import { PaymentBreakdown } from '../components/reports/PaymentBreakdown';
import { SalesByAttendant } from '../components/reports/SalesByAttendant';
import { PeriodSelector } from '../components/reports/PeriodSelector';
import { ExportButton, type ExportColumn } from '../components/reports/ExportButton';
import { Skeleton } from '../components/ui/skeleton';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import type { DateRange, ReportSummary, SalesTrendPoint, PaymentBreakdown as PaymentBreakdownType, AttendantPerformance } from '../types/reports';

function ReportsSales() {
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
  const [payment, setPayment] = useState<PaymentBreakdownType[]>([]);
  const [attendants, setAttendants] = useState<AttendantPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [s, t, p, a] = await Promise.all([
          ReportsRepository.getReportSummary(period.from, period.to),
          ReportsRepository.getSalesTrend(period.preset, period.from, period.to),
          ReportsRepository.getPaymentBreakdown(period.from, period.to),
          ReportsRepository.getSalesByAttendant(period.from, period.to),
        ]);
        if (!cancelled) {
          setSummary(s);
          setTrend(t);
          setPayment(p);
          setAttendants(a);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period]);

  const attendantColumns: ExportColumn<AttendantPerformance>[] = [
    { key: 'name', header: 'Attendant' },
    { key: 'salesCount', header: 'Sales' },
    { key: 'totalRevenue', header: 'Revenue', format: (v) => formatCurrency(v as number) },
    { key: 'avgOrderValue', header: 'Avg Order', format: (v) => formatCurrency(v as number) },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<DollarSign className="size-4 text-primary" />}
        title="Sales Report"
        description="Revenue, orders, and payment analytics"
        actions={
          <ExportButton
            data={attendants}
            columns={attendantColumns}
            filename="sales-report"
          />
        }
      />

      <PeriodSelector value={period} onChange={setPeriod} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          icon={<Users className="size-4" />}
          label="Attendants"
          value={attendants.length}
          accent="bg-chart-5"
        />
      </div>

      <SalesTrendChart data={trend} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PaymentBreakdown data={payment} />
        <SalesByAttendant data={attendants} />
      </div>
    </div>
  );
}

export default ReportsSales;
