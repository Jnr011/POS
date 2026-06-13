import { useAuthStore } from '../store/authStore';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { formatCurrency } from '../lib/currency';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

function SalesRepDashboard() {
  const user = useAuthStore(s => s.user);
  const { sales, loading: salesLoading } = useSales();
  const { products, loading: productsLoading } = useProducts();

  const loading = salesLoading || productsLoading;

  const mySales = sales.filter(s => s.user_id === user?.id);
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = mySales.filter(s => s.date?.startsWith(today));

  const todaysRevenue = todaysSales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
  const todaysCount = todaysSales.length;
  const commission = todaysRevenue * 0.05;

  const recentSales = mySales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const lowStock = products.filter(p => p.stock_quantity <= (p.min_stock ?? 10) && p.stock_quantity > 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <PageHeader
        icon={<ClipboardList className="size-4 text-primary" />}
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Sales Rep'}`}
        description="Here's your performance overview"
      />

      {/* ── Stat cards ── */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<DollarSign className="size-4 text-success" />}
          label="Today's Sales"
          value={formatCurrency(todaysRevenue)}
          sub="Revenue today"
          accent="bg-success"
        />
        <StatCard
          icon={<ShoppingCart className="size-4 text-primary" />}
          label="My Sales Today"
          value={todaysCount}
          sub="Transactions completed"
          accent="bg-primary"
        />
        <StatCard
          icon={<TrendingUp className="size-4 text-warning" />}
          label="Commission"
          value={formatCurrency(commission)}
          sub="5% on sales"
          accent="bg-warning"
        />
        <StatCard
          icon={<Package className="size-4 text-primary" />}
          label="Products Available"
          value={products.length}
          sub="Ready to sell"
          accent="bg-primary"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div data-tour="dashboard-actions">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/pos" className="block">
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingCart className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">New Sale</p>
                  <p className="text-xs text-muted-foreground">Process a new transaction</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/returns" className="block">
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                  <Receipt className="size-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Process Return</p>
                  <p className="text-xs text-muted-foreground">Handle customer returns</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/sales" className="block">
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardList className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Today's Sales</p>
                  <p className="text-xs text-muted-foreground">{todaysCount} transaction{todaysCount !== 1 ? 's' : ''} today</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div data-tour="dashboard-transactions">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">My Recent Transactions</h2>
        </div>
        {recentSales.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale, i) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium tabular-nums">
                        {String(sale.id).slice(-3).padStart(3, '0')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>{sale.items?.length ?? 0}</TableCell>
                      <TableCell className="tabular-nums font-medium">{formatCurrency(sale.grand_total)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.syncStatus === 'synced' ? 'secondary' : 'outline'}>
                          {sale.syncStatus === 'synced' ? 'Synced' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No sales yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start by recording your first transaction at the POS terminal.
              </p>
              <Link
                to="/pos"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                Go to POS <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Low Stock Alerts ── */}
      {lowStock.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          </div>
          <Card>
            <CardContent className="p-4 space-y-2">
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span className="text-destructive font-medium tabular-nums">
                    Only {p.stock_quantity} left
                  </span>
                </div>
              ))}
              {lowStock.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{lowStock.length - 5} more low stock items
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

export default SalesRepDashboard;
