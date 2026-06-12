import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportsData, Sale, TopProduct } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { PageHeader } from '../components/PageHeader';
import {
  BarChart3,
  TrendingUp,
  ClipboardList,
  Package,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const tabs = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'top', label: 'Top Products' },
] as const;

function Reports() {
  const { reports, getProductName, loading } = useReports();
  const [activeTab, setActiveTab] = useState('daily');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<BarChart3 className="size-4 text-primary" />}
        title="Reports"
        description="Sales and inventory analytics"
      />

      <div className="flex gap-1.5 bg-muted p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Daily Sales Report</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as ReportsData).daily.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No sales today</TableCell>
                  </TableRow>
                ) : (
                  (reports as ReportsData).daily.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{getProductName(sale.product_id)}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>₵{sale.total_price}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Weekly Sales Report</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as ReportsData).weekly.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No sales this week</TableCell>
                  </TableRow>
                ) : (
                  (reports as ReportsData).weekly.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{getProductName(sale.product_id)}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>₵{sale.total_price}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Monthly Sales Report</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as ReportsData).monthly.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No sales this month</TableCell>
                  </TableRow>
                ) : (
                  (reports as ReportsData).monthly.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{getProductName(sale.product_id)}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>₵{sale.total_price}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Inventory Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="size-4" />
                    Total Products
                  </div>
                  <p className="text-3xl font-bold">{(reports as ReportsData).inventory.totalProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="size-4" />
                    Total Value
                  </div>
                  <p className="text-3xl font-bold">₵{(reports as ReportsData).inventory.totalValue?.toFixed(2) || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="size-4" />
                    Low Stock Items
                  </div>
                  <p className="text-3xl font-bold">{(reports as ReportsData).inventory.lowStockProducts}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Top 10 Products</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Total Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as ReportsData).topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No sales data</TableCell>
                  </TableRow>
                ) : (
                  (reports as ReportsData).topProducts.map((product: TopProduct, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>{getProductName(product.product_id)}</TableCell>
                      <TableCell>{product.totalQuantitySold}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
