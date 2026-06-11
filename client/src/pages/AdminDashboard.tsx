import React from 'react';
import { useToast } from '../components/Toast';
import { useReports } from '../hooks/useReports';
import { InventoryStatus } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';

function AdminDashboard() {
  const { addToast } = useToast();
  const { reports, loading } = useReports();
  const inv = reports.inventory as InventoryStatus & {
    totalUsers?: number;
    totalRevenue?: number;
    totalSalesToday?: number;
  };

  if (loading) return <div className="p-6"><p>Loading admin dashboard...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📦 Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inv?.totalProducts || 0}</p>
            <p className="text-sm text-muted-foreground">Managed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚠️ Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inv?.lowStockProducts || 0}</p>
            <p className="text-sm text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">GHS {(inv?.totalValue || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>👥 Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inv?.totalUsers || 0}</p>
            <p className="text-sm text-muted-foreground">Active users in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💵 Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">GHS {(inv?.totalRevenue || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">All-time sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">GHS {(inv?.totalSalesToday || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Today's revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Admin Only Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>✓ View all inventory</li>
              <li>✓ Manage products</li>
              <li>✓ View all sales reports</li>
              <li>✓ Register new sales reps</li>
              <li>✓ View user statistics</li>
              <li>✓ Access system reports</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Registration Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              Share this code with new admins to register sales reps:
            </p>
            <div className="bg-muted rounded p-4 inline-flex items-center gap-2">
              <code>ADMIN2024</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText('ADMIN2024');
                  addToast('Registration code copied!', 'success');
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
