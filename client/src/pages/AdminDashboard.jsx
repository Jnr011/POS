import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    totalSalesToday: 0,
    totalUsers: 0,
    totalRevenue: 0
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

        // Fetch inventory status
        const inventoryRes = await API.get('/reports/inventory/status', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setStats(prev => ({
          ...prev,
          totalProducts: inventoryRes.data.totalProducts || 0,
          lowStockCount: inventoryRes.data.lowStockProducts || 0,
          totalInventoryValue: inventoryRes.data.totalValue || 0,
          totalRevenue: inventoryRes.data.totalRevenue || 0,
          totalUsers: inventoryRes.data.totalUsers || 0
        }));
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        setError('Failed to load dashboard data. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="dashboard"><p>Loading admin dashboard...</p></div>;

  return (
    <div className="dashboard">
      <h1>📊 Admin Dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="stats-grid">
        <div className="stat-card admin-card">
          <h3>📦 Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
          <span className="stat-label">Managed</span>
        </div>

        <div className="stat-card warning-card">
          <h3>⚠️ Low Stock Alert</h3>
          <p className="stat-value">{stats.lowStockCount}</p>
          <span className="stat-label">Items below threshold</span>
        </div>

        <div className="stat-card">
          <h3>💰 Inventory Value</h3>
          <p className="stat-value">GHS {stats.totalInventoryValue.toFixed(2)}</p>
          <span className="stat-label">Total stock value</span>
        </div>

        <div className="stat-card">
          <h3>👥 Total Users</h3>
          <p className="stat-value">{stats.totalUsers}</p>
          <span className="stat-label">Active users in system</span>
        </div>

        <div className="stat-card success-card">
          <h3>💵 Total Revenue</h3>
          <p className="stat-value">GHS {stats.totalRevenue.toFixed(2)}</p>
          <span className="stat-label">All-time sales</span>
        </div>

        <div className="stat-card">
          <h3>📈 Today's Sales</h3>
          <p className="stat-value">GHS {stats.totalSalesToday.toFixed(2)}</p>
          <span className="stat-label">Today's revenue</span>
        </div>
      </div>

      <div className="admin-actions">
        <div className="action-card">
          <h3>🔧 Admin Only Features</h3>
          <ul>
            <li>✓ View all inventory</li>
            <li>✓ Manage products</li>
            <li>✓ View all sales reports</li>
            <li>✓ Register new sales reps</li>
            <li>✓ View user statistics</li>
            <li>✓ Access system reports</li>
          </ul>
        </div>

        <div className="action-card">
          <h3>� Registration Code</h3>
          <p style={{ fontSize: '14px', marginBottom: '10px' }}>
            Share this code with new admins to register sales reps:
          </p>
          <div className="code-box">
            <code>ADMIN2024</code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText('ADMIN2024');
                alert('Code copied!');
              }}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
