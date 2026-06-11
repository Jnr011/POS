import React from 'react';
import { useToast } from '../components/Toast';
import { useReports } from '../hooks/useReports';
import '../styles/Dashboard.css';

function AdminDashboard() {
  const { addToast } = useToast();
  const { reports, loading } = useReports();
  const inv = reports.inventory;

  if (loading) return <div className="dashboard"><p>Loading admin dashboard...</p></div>;

  return (
    <div className="dashboard">
      <h1>📊 Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card admin-card">
          <h3>📦 Total Products</h3>
          <p className="stat-value">{inv?.totalProducts || 0}</p>
          <span className="stat-label">Managed</span>
        </div>

        <div className="stat-card warning-card">
          <h3>⚠️ Low Stock Alert</h3>
          <p className="stat-value">{inv?.lowStockProducts || 0}</p>
          <span className="stat-label">Items below threshold</span>
        </div>

        <div className="stat-card">
          <h3>💰 Inventory Value</h3>
          <p className="stat-value">GHS {(inv?.totalValue || 0).toFixed(2)}</p>
          <span className="stat-label">Total stock value</span>
        </div>

        <div className="stat-card">
          <h3>👥 Total Users</h3>
          <p className="stat-value">{inv?.totalUsers || 0}</p>
          <span className="stat-label">Active users in system</span>
        </div>

        <div className="stat-card success-card">
          <h3>💵 Total Revenue</h3>
          <p className="stat-value">GHS {(inv?.totalRevenue || 0).toFixed(2)}</p>
          <span className="stat-label">All-time sales</span>
        </div>

        <div className="stat-card">
          <h3>📈 Today's Sales</h3>
          <p className="stat-value">GHS {(inv?.totalSalesToday || 0).toFixed(2)}</p>
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
                addToast('Registration code copied!', 'success');
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
