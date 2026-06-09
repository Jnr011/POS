import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/Dashboard.css';

function SalesRepDashboard() {
  const [stats, setStats] = useState({
    todaysSales: 0,
    salesCount: 0,
    productsAvailable: 0,
    myCommission: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch sales data
        const salesRes = await API.get('/sales', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Calculate today's sales for this sales rep
        const today = new Date().toISOString().split('T')[0];
        const todaysSales = salesRes.data.filter(sale => 
          sale.date?.includes(today)
        ).reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);

        const sales = salesRes.data || [];

        setStats({
          todaysSales: todaysSales,
          salesCount: sales.length,
          productsAvailable: 30, // This would be fetched from inventory
          myCommission: todaysSales * 0.05 // 5% commission
        });

        // Get recent sales (last 5)
        setRecentSales(sales.slice(-5).reverse());
      } catch (error) {
        console.error('Error fetching sales rep dashboard:', error);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="dashboard"><p>Loading your dashboard...</p></div>;

  return (
    <div className="dashboard">
      <h1>💼 Welcome, Sales Representative</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card sales-card">
          <h3>📊 Today's Sales</h3>
          <p className="stat-value">GHS {stats.todaysSales.toFixed(2)}</p>
          <span className="stat-label">Your earnings today</span>
        </div>

        <div className="stat-card">
          <h3>🔢 Sales Transactions</h3>
          <p className="stat-value">{stats.salesCount}</p>
          <span className="stat-label">Total transactions</span>
        </div>

        <div className="stat-card">
          <h3>📦 Products Available</h3>
          <p className="stat-value">{stats.productsAvailable}</p>
          <span className="stat-label">Ready to sell</span>
        </div>

        <div className="stat-card success-card">
          <h3>💰 Estimated Commission</h3>
          <p className="stat-value">GHS {stats.myCommission.toFixed(2)}</p>
          <span className="stat-label">5% on sales</span>
        </div>
      </div>

      <div className="recent-sales">
        <h2>📈 Your Recent Sales</h2>
        {recentSales.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Amount (GHS)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale, index) => (
                <tr key={index}>
                  <td>#{sale.product_id}</td>
                  <td>{sale.quantity}</td>
                  <td>GHS {parseFloat(sale.total_price || 0).toFixed(2)}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No sales yet. Start by accessing the Sales page to record your first transaction!
          </p>
        )}
      </div>

      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-grid">
          <div className="action-item">
            <h4>📤 Record Sale</h4>
            <p>Log a new product sale</p>
            <a href="/sales" className="action-link">Go to Sales →</a>
          </div>
          <div className="action-item">
            <h4>📋 View Inventory</h4>
            <p>Check available products</p>
            <a href="/inventory" className="action-link">Check Inventory →</a>
          </div>
          <div className="action-item">
            <h4>📊 Daily Summary</h4>
            <p>View today's performance</p>
            <a href="/dashboard" className="action-link">Refresh Stats →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesRepDashboard;
