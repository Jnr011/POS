import { useState, useEffect } from 'react';
import { ReportsRepository } from '../db/repository';
import { PageHeader } from '../components/PageHeader';
import { InventoryValuation } from '../components/reports/InventoryValuation';
import { ExportButton, type ExportColumn } from '../components/reports/ExportButton';
import { Skeleton } from '../components/ui/skeleton';
import { Package } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import type { InventoryValuation as InventoryValuationType } from '../types/reports';

function ReportsInventory() {
  const [valuation, setValuation] = useState<InventoryValuationType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const v = await ReportsRepository.getInventoryValuation();
        if (!cancelled) setValuation(v);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const categoryColumns: ExportColumn<{ category: string; value: number; count: number }>[] = [
    { key: 'category', header: 'Category' },
    { key: 'count', header: 'Products' },
    { key: 'value', header: 'Value', format: (v) => formatCurrency(v as number) },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Package className="size-4 text-primary" />}
        title="Inventory"
        description="Stock valuation and category breakdown"
        actions={
          valuation && (
            <ExportButton
              data={valuation.byCategory}
              columns={categoryColumns}
              filename="inventory-valuation"
            />
          )
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : valuation ? (
        <InventoryValuation data={valuation} />
      ) : null}
    </div>
  );
}

export default ReportsInventory;
