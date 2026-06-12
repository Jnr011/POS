import { Clock, AlertTriangle } from 'lucide-react';
import { AccordionAlert } from '../ui/alert';
import { Badge } from '../ui/badge';
import type { Product } from '../../types';
import { THIRTY_DAYS } from '../../lib/inventory-utils';

interface InventoryAlertsProps {
  products: Product[];
}

function InventoryAlerts({ products }: InventoryAlertsProps) {
  const now = Date.now();

  const expiringSoon = products.filter(p => {
    if (!p.expiry_date) return false;
    const ts = new Date(p.expiry_date).getTime();
    return ts > now && ts - now <= THIRTY_DAYS;
  });

  const lowStock = products.filter(p => {
    const min = p.min_stock ?? 10;
    return p.stock_quantity > 0 && p.stock_quantity <= min;
  });

  if (expiringSoon.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="space-y-3">
      {expiringSoon.length > 0 && (
        <AccordionAlert
          variant="warning"
          icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
          summary={
            <p className="text-sm font-medium">
              {expiringSoon.length} item{expiringSoon.length !== 1 ? 's' : ''} expiring soon
            </p>
          }
          expandedContent={
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {expiringSoon.map(p => {
                const days = Math.ceil((new Date(p.expiry_date!).getTime() - now) / 86_400_000);
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1">
                    <div className="min-w-0 flex-1">
                      <span className="truncate block">{p.name}</span>
                      <span className="text-xs opacity-70">{p.category}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-3 text-[10px] border-amber-300 dark:border-amber-700">
                      {days}d left
                    </Badge>
                  </div>
                );
              })}
            </div>
          }
        />
      )}

      {lowStock.length > 0 && (
        <AccordionAlert
          variant="destructive"
          icon={<AlertTriangle className="size-5 text-destructive" />}
          summary={
            <p className="text-sm font-medium">
              {lowStock.length} item{lowStock.length !== 1 ? 's' : ''} low in stock
            </p>
          }
          expandedContent={
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1">
                  <div className="min-w-0 flex-1">
                    <span className="truncate block">{p.name}</span>
                    <span className="text-xs opacity-70">{p.category}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 ml-3 text-[10px] border-destructive/30">
                    {p.stock_quantity} / {p.min_stock ?? 10}
                  </Badge>
                </div>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
}

export { InventoryAlerts };
export type { InventoryAlertsProps };
