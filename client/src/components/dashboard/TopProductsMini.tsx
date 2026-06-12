import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Package } from 'lucide-react';
import type { ProductPerformance } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';

interface TopProductsMiniProps {
  data: ProductPerformance[];
  className?: string;
}

function TopProductsMini({ data, className }: TopProductsMiniProps) {
  const hasData = data.length > 0 && data.some(d => d.revenue > 0);
  const maxRevenue = hasData ? Math.max(...data.map(d => d.revenue ?? 0)) : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            compact
            icon={<Package className="size-4 text-muted-foreground/50" />}
            title="No product sales"
            description="Rankings will appear once sales are recorded"
          />
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((item, i) => {
              const revenue = item.revenue ?? 0;
              const barWidth = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
              return (
                <div key={item.productId ?? i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-4 text-right tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{item.name ?? 'Unknown'}</p>
                      <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TopProductsMini };
