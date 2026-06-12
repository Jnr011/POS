import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Users } from 'lucide-react';
import type { AttendantPerformance } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';
import { cn } from '../../lib/utils';

interface SalesByAttendantProps {
  data: AttendantPerformance[];
  className?: string;
}

function SalesByAttendant({ data, className }: SalesByAttendantProps) {
  const hasData = data.length > 0 && data.some(d => d.totalRevenue > 0 || d.salesCount > 0);
  const maxRevenue = hasData ? Math.max(...data.map(d => d.totalRevenue)) : 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Sales by Attendant</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={<Users className="size-5 text-muted-foreground/50" />}
            title="No sales by attendants"
            description="Attendant performance will appear here once sales are recorded"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Attendant</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(item => {
                const barWidth = maxRevenue > 0 ? (item.totalRevenue / maxRevenue) * 100 : 0;
                return (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {item.salesCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCurrency(item.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatCurrency(item.avgOrderValue)}
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

export { SalesByAttendant };
