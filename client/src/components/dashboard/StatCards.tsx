import { MetricCard } from '../reports/MetricCard';
import { DollarSign, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface DashboardStatCardsProps {
  revenueToday: number;
  ordersToday: number;
  lowStockCount: number;
  inventoryValue: number;
  onLowStockClick?: () => void;
}

function DashboardStatCards({
  revenueToday,
  ordersToday,
  lowStockCount,
  inventoryValue,
  onLowStockClick,
}: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={<DollarSign className="size-4" />}
        label="Revenue Today"
        value={formatCurrency(revenueToday)}
        accent="bg-chart-1"
      />
      <MetricCard
        icon={<ShoppingCart className="size-4" />}
        label="Orders Today"
        value={ordersToday}
        accent="bg-chart-2"
      />
      <MetricCard
        icon={<AlertTriangle className="size-4" />}
        label="Low Stock"
        value={lowStockCount}
        accent="bg-warning"
        className={lowStockCount > 0 ? 'cursor-pointer hover:bg-muted/50 transition-colors' : undefined}
        onClick={lowStockCount > 0 ? onLowStockClick : undefined}
      />
      <MetricCard
        icon={<Package className="size-4" />}
        label="Inventory Value"
        value={formatCurrency(inventoryValue)}
        accent="bg-chart-3"
      />
    </div>
  );
}

export { DashboardStatCards };
