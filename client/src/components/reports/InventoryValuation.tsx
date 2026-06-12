import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MetricCard } from './MetricCard';
import { EmptyState } from '../ui/empty-state';
import { Package, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import type { InventoryValuation as InventoryValuationType } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';
import { cn } from '../../lib/utils';

interface InventoryValuationProps {
  data: InventoryValuationType;
  className?: string;
}

function InventoryValuation({ data, className }: InventoryValuationProps) {
  const maxCategoryValue = Math.max(...data.byCategory.map(c => c.value));

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<DollarSign className="size-4" />}
          label="Total Inventory Value"
          value={formatCurrency(data.totalValue)}
          accent="bg-chart-1"
        />
        <MetricCard
          icon={<Package className="size-4" />}
          label="Total Products"
          value={data.totalProducts.toLocaleString()}
          accent="bg-chart-2"
        />
        <MetricCard
          icon={<AlertTriangle className="size-4" />}
          label="Low Stock Items"
          value={data.lowStockCount.toLocaleString()}
          accent="bg-warning"
        />
        <MetricCard
          icon={<Clock className="size-4" />}
          label="Expiring Soon"
          value={data.expiringSoonCount.toLocaleString()}
          accent="bg-destructive"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Total Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCategory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState compact title="No inventory data" />
                  </TableCell>
                </TableRow>
              ) : (
                data.byCategory.map(cat => {
                  const barWidth = maxCategoryValue > 0 ? (cat.value / maxCategoryValue) * 100 : 0;
                  return (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium text-sm">{cat.category}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{cat.count}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{cat.count.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {formatCurrency(cat.value)}
                      </TableCell>
                      <TableCell>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export { InventoryValuation };
