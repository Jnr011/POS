
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    totalSalesToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const [inventoryRes, salesRes] = await Promise.all([
          API.get('/reports/inventory/status', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          API.get('/sales/daily/summary', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const totalSales = inventoryRes.data.sales ? 
          inventoryRes.data.sales.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) : 
          0;

        setStats({
          totalProducts: inventoryRes.data.totalProducts || 0,
          lowStockCount: inventoryRes.data.lowStockProducts || 0,
          totalInventoryValue: inventoryRes.data.totalValue || 0,
          totalSalesToday: totalSales
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard data. Make sure the server is running.');
        setStats({
          totalProducts: 0,
          lowStockCount: 0,
          totalInventoryValue: 0,
          totalSalesToday: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="dashboard"><p>Loading dashboard...</p></div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card warning">
          <h3>Low Stock Items</h3>
          <p className="stat-value">{stats.lowStockCount}</p>
        </div>
        <div className="stat-card">
          <h3>Inventory Value</h3>
          <p className="stat-value">₵{stats.totalInventoryValue.toFixed(2)}</p>
        </div>
        <div className="stat-card success">
          <h3>Today's Sales</h3>
          <p className="stat-value">₵{stats.totalSalesToday.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
