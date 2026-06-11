import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportsData, Sale, TopProduct } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

function Reports() {
  const { reports, getProductName, loading } = useReports();
  const [activeTab, setActiveTab] = useState('daily');

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="flex gap-2">
        <Button variant={activeTab === 'daily' ? 'default' : 'outline'} onClick={() => setActiveTab('daily')}>
          Daily Sales
        </Button>
        <Button variant={activeTab === 'weekly' ? 'default' : 'outline'} onClick={() => setActiveTab('weekly')}>
          Weekly Sales
        </Button>
        <Button variant={activeTab === 'monthly' ? 'default' : 'outline'} onClick={() => setActiveTab('monthly')}>
          Monthly Sales
        </Button>
        <Button variant={activeTab === 'inventory' ? 'default' : 'outline'} onClick={() => setActiveTab('inventory')}>
          Inventory Status
        </Button>
        <Button variant={activeTab === 'top' ? 'default' : 'outline'} onClick={() => setActiveTab('top')}>
          Top Products
        </Button>
      </div>

      <div>
        {activeTab === 'daily' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Daily Sales Report</h2>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No sales today</TableCell>
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Weekly Sales Report</h2>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No sales this week</TableCell>
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Monthly Sales Report</h2>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No sales this month</TableCell>
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Inventory Status Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{(reports as ReportsData).inventory.totalProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Inventory Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">₵{(reports as ReportsData).inventory.totalValue?.toFixed(2) || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{(reports as ReportsData).inventory.lowStockProducts}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Top 10 Products</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Total Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as ReportsData).topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No sales data</TableCell>
                  </TableRow>
                ) : (
                  (reports as ReportsData).topProducts.map((product: TopProduct, idx: number) => (
                    <TableRow key={idx}>
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
