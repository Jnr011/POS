import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { CreditCard, Banknote, Smartphone, DollarSign } from 'lucide-react';
import type { PaymentBreakdown as PaymentBreakdownType } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';
import { cn } from '../../lib/utils';

const METHOD_CONFIG = {
  cash: { icon: Banknote, label: 'Cash', color: 'bg-chart-1' },
  card: { icon: CreditCard, label: 'Card', color: 'bg-chart-2' },
  mobile_money: { icon: Smartphone, label: 'Mobile Money', color: 'bg-chart-3' },
} as const;

interface PaymentBreakdownProps {
  data: PaymentBreakdownType[];
  className?: string;
}

function PaymentBreakdown({ data, className }: PaymentBreakdownProps) {
  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="size-5 text-muted-foreground/50" />}
            title="No payments recorded"
            description="Payment breakdown will appear here once sales are recorded"
          />
        ) : (
          <div className="space-y-4">
            {data.map(item => {
              const config = METHOD_CONFIG[item.method];
              const Icon = config.icon;
              const amountPercent = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;

              return (
                <div key={item.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('size-2 rounded-full', config.color)} />
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(item.total)}</span>
                      <span className="text-xs text-muted-foreground ml-2 tabular-nums">
                        {item.count} txns · {amountPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', config.color)}
                      style={{ width: `${amountPercent}%` }}
                    />
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

export { PaymentBreakdown };
