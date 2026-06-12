import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Package } from 'lucide-react';
import type { ProductPerformance } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';
import { cn } from '../../lib/utils';

interface TopProductsTableProps {
  data: ProductPerformance[];
  className?: string;
}

function TopProductsTable({ data, className }: TopProductsTableProps) {
  const hasData = data.length > 0 && data.some(d => d.revenue > 0 || d.totalSold > 0);
  const maxRevenue = hasData ? Math.max(...data.map(d => d.revenue ?? 0)) : 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Top Products</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!hasData ? (
          <EmptyState
            icon={<Package className="size-5 text-muted-foreground/50" />}
            title="No product sales"
            description="Product rankings will appear here once sales are recorded"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, i) => {
                const revenue = item.revenue ?? 0;
                const totalSold = item.totalSold ?? 0;
                const barWidth = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                return (
                  <TableRow key={item.productId ?? i}>
                    <TableCell className="text-center text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{item.name ?? 'Unknown'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category ?? ''}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{totalSold}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCurrency(revenue)}
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
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export { TopProductsTable };
