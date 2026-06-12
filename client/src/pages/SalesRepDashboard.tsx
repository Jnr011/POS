import React from 'react';
import { Link } from 'react-router-dom';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useAuthStore } from '../store/authStore';
import { Product, Sale } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Target,
  ClipboardList,
} from 'lucide-react';

function SalesRepDashboard() {
  const user = useAuthStore((state) => state.user);
  const { sales, loading: salesLoading } = useSales();
  const { products, loading: productsLoading } = useProducts();

  const loading = salesLoading || productsLoading;

  const productMap: Record<number, string> = {};
  (products as Product[]).forEach(p => { productMap[p.id] = p.name; });

  const mySales = (sales as Sale[]).filter(sale => sale.user_id === user?.id);
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = mySales.filter(sale =>
    sale.date?.includes(today)
  ).reduce((sum, sale) => sum + Number(sale.total_price || 0), 0);

  const recentSales = mySales.slice(-5).reverse();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="h-1 bg-[oklch(0.55_0.16_220/0.1)]" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<ClipboardList className="size-4 text-primary" />}
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Sales Rep'}`}
        description="Here's your sales overview"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="size-4 text-success" />}
          label="Today's Sales"
          value={`GHS ${todaysSales.toFixed(2)}`}
          sub="Your revenue today"
          accent="bg-success"
        />
        <StatCard
          icon={<ShoppingCart className="size-4 text-primary" />}
          label="Transactions"
          value={mySales.length}
          sub="Total sales recorded"
          accent="bg-primary"
        />
        <StatCard
          icon={<Package className="size-4 text-primary" />}
          label="Products Available"
          value={products.length}
          sub="Ready to sell"
          accent="bg-primary"
        />
        <StatCard
          icon={<Target className="size-4 text-warning" />}
          label="Commission"
          value={`GHS ${(todaysSales * 0.05).toFixed(2)}`}
          sub="5% on sales"
          accent="bg-warning"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Sales</h2>
        </div>
        {recentSales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount (GHS)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell>{productMap[sale.product_id] || `Product #${sale.product_id}`}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>GHS {Number(sale.total_price || 0).toFixed(2)}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="size-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No sales yet</p>
            <p className="text-xs mt-1">Start by recording your first transaction</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="size-4 text-primary" />
              Record Sale
            </div>
            <p className="text-xs text-muted-foreground">Log a new product sale</p>
            <Link to="/sales" className="text-xs text-primary hover:underline inline-block mt-1">
              Go to Sales {'\u2192'}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="size-4 text-primary" />
              View Inventory
            </div>
            <p className="text-xs text-muted-foreground">Check available products</p>
            <Link to="/inventory" className="text-xs text-primary hover:underline inline-block mt-1">
              Check Inventory {'\u2192'}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-primary" />
              Daily Summary
            </div>
            <p className="text-xs text-muted-foreground">View today's performance</p>
            <Link to="/dashboard" className="text-xs text-primary hover:underline inline-block mt-1">
              Refresh Stats {'\u2192'}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SalesRepDashboard;
