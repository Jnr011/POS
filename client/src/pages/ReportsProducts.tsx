import { useState, useEffect } from 'react';
import { ReportsRepository } from '../db/repository';
import { PageHeader } from '../components/PageHeader';
import { TopProductsTable } from '../components/reports/TopProductsTable';
import { PeriodSelector } from '../components/reports/PeriodSelector';
import { ExportButton, type ExportColumn } from '../components/reports/ExportButton';
import { Skeleton } from '../components/ui/skeleton';
import { Package } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import type { DateRange, ProductPerformance } from '../types/reports';

function ReportsProducts() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [period, setPeriod] = useState<DateRange>({
    from: monthStart,
    to: now,
    label: `${monthStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    preset: 'this_month',
  });

  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const p = await ReportsRepository.getProductPerformance(period.from, period.to, 20);
        if (!cancelled) setProducts(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period]);

  const columns: ExportColumn<ProductPerformance>[] = [
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'totalSold', header: 'Units Sold' },
    { key: 'revenue', header: 'Revenue', format: (v) => formatCurrency(v as number) },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Package className="size-4 text-primary" />}
        title="Products"
        description="Product performance and sales breakdown"
        actions={
          <ExportButton data={products} columns={columns} filename="product-performance" />
        }
      />

      <PeriodSelector value={period} onChange={setPeriod} />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <TopProductsTable data={products} />
      )}
    </div>
  );
}

export default ReportsProducts;
