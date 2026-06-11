import React from 'react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useAuthStore } from '../store/authStore';
import { Product, Sale } from '../types';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

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

  if (loading) return <div className="p-6"><p>Loading your dashboard...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">💼 Welcome, Sales Representative</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">GHS {todaysSales.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Your earnings today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔢 Sales Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mySales.length}</p>
            <p className="text-sm text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📦 Products Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{products.length}</p>
            <p className="text-sm text-muted-foreground">Ready to sell</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 Estimated Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">GHS {(todaysSales * 0.05).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">5% on sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">📈 Your Recent Sales</h2>
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
          <p className="py-5 text-center text-muted-foreground">
            No sales yet. Start by accessing the Sales page to record your first transaction!
          </p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>📤 Record Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Log a new product sale</p>
              <a href="/sales" className="text-sm text-primary hover:underline">Go to Sales →</a>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>📋 View Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Check available products</p>
              <a href="/inventory" className="text-sm text-primary hover:underline">Check Inventory →</a>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>📊 Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">View today's performance</p>
              <a href="/dashboard" className="text-sm text-primary hover:underline">Refresh Stats →</a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SalesRepDashboard;
