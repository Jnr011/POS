import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Badge } from '../ui/badge';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import type { Product } from '../../types';
import { cn } from '../../lib/utils';

interface LowStockAlertProps {
  lowStockProducts: Product[];
  expiringProducts: Product[];
  className?: string;
}

function LowStockAlert({ lowStockProducts, expiringProducts, className }: LowStockAlertProps) {
  const hasAny = lowStockProducts.length > 0 || expiringProducts.length > 0;

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Action Required</CardTitle>
          {hasAny && (
            <Badge variant="outline" className="text-[10px] font-medium border-0 px-1.5 py-0 bg-warning/10 text-warning">
              {lowStockProducts.length + expiringProducts.length} items
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {!hasAny ? (
          <EmptyState
            compact
            icon={<AlertTriangle className="size-4 text-muted-foreground/50" />}
            title="All clear"
            description="No low stock or expiring items"
          />
        ) : (
          <div className="space-y-3 flex-1">
            {lowStockProducts.slice(0, 3).map(product => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg bg-destructive/[0.04]">
                <div className="size-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-3.5 text-destructive/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Only <span className="font-medium text-destructive">{product.stock_quantity}</span> left
                  </p>
                </div>
              </div>
            ))}
            {expiringProducts.slice(0, 2).map(product => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg bg-warning/[0.04]">
                <div className="size-7 rounded-md bg-warning/10 flex items-center justify-center shrink-0">
                  <Clock className="size-3.5 text-warning/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {product.expiry_date ? format(new Date(product.expiry_date), 'MMM d') : 'soon'}
                  </p>
                </div>
              </div>
            ))}
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4 mt-auto pt-1"
            >
              View all inventory
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { LowStockAlert };
