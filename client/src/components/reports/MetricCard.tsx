import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  accent?: string;
  className?: string;
}

function MetricCard({ icon, label, value, change, accent, className }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {accent && <div className={cn('h-1', accent)} />}
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive && <TrendingUp className="size-3 text-accent" />}
                {isNegative && <TrendingDown className="size-3 text-destructive" />}
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    isPositive && 'text-accent',
                    isNegative && 'text-destructive',
                    isNeutral && 'text-muted-foreground',
                  )}
                >
                  {isPositive && '+'}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs prev period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { MetricCard };
export type { MetricCardProps };
