import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Badge } from '../ui/badge';
import { Receipt } from 'lucide-react';
import type { Sale } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { cn } from '../../lib/utils';

const SYNC_STYLES: Record<string, string> = {
  synced: 'bg-accent/10 text-accent',
  pending: 'bg-warning/10 text-warning',
  conflict: 'bg-destructive/10 text-destructive',
};

interface RecentTransactionsProps {
  data: Sale[];
  className?: string;
}

function RecentTransactions({ data, className }: RecentTransactionsProps) {
  const recent = data.slice(0, 5);

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {recent.length === 0 ? (
          <EmptyState
            compact
            icon={<Receipt className="size-4 text-muted-foreground/50" />}
            title="No transactions today"
            description="Sales will appear here as they happen"
          />
        ) : (
          <div className="space-y-2 flex-1">
            {recent.map(sale => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">#{String(sale.id).padStart(4, '0')}</p>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-medium border-0 px-1.5 py-0', SYNC_STYLES[sale.syncStatus])}
                    >
                      {sale.syncStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sale.date ? format(new Date(sale.date), 'h:mm a') : '—'}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(sale.grand_total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentTransactions };
