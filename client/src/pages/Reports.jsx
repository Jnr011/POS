import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import '../styles/Reports.css';

function Reports() {
  const { reports, getProductName, loading } = useReports();
  const [activeTab, setActiveTab] = useState('daily');

  if (loading) return <div className="reports">Loading...</div>;

  return (
    <div className="reports">
      <h1>Reports</h1>
      <div className="tabs">
        <button className={activeTab === 'daily' ? 'active' : ''} onClick={() => setActiveTab('daily')}>
          Daily Sales
        </button>
        <button className={activeTab === 'weekly' ? 'active' : ''} onClick={() => setActiveTab('weekly')}>
          Weekly Sales
        </button>
        <button className={activeTab === 'monthly' ? 'active' : ''} onClick={() => setActiveTab('monthly')}>
          Monthly Sales
        </button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
          Inventory Status
        </button>
        <button className={activeTab === 'top' ? 'active' : ''} onClick={() => setActiveTab('top')}>
          Top Products
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'daily' && (
          <div>
            <h2>Daily Sales Report</h2>
              <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.daily.length === 0 ? (
                  <tr><td colSpan="4">No sales today</td></tr>
                ) : (
                  reports.daily.map(sale => (
                    <tr key={sale.id}>
                      <td>{getProductName(sale.product_id)}</td>
                      <td>{sale.quantity}</td>
                      <td>₵{sale.total_price}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div>
            <h2>Weekly Sales Report</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.weekly.length === 0 ? (
                  <tr><td colSpan="4">No sales this week</td></tr>
                ) : (
                  reports.weekly.map(sale => (
                    <tr key={sale.id}>
                      <td>{getProductName(sale.product_id)}</td>
                      <td>{sale.quantity}</td>
                      <td>₵{sale.total_price}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div>
            <h2>Monthly Sales Report</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.monthly.length === 0 ? (
                  <tr><td colSpan="4">No sales this month</td></tr>
                ) : (
                  reports.monthly.map(sale => (
                    <tr key={sale.id}>
                      <td>{getProductName(sale.product_id)}</td>
                      <td>{sale.quantity}</td>
                      <td>₵{sale.total_price}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-report">
            <h2>Inventory Status Report</h2>
            <div className="inventory-stats">
              <div className="stat-item">
                <span>Total Products:</span>
                <strong>{reports.inventory.totalProducts}</strong>
              </div>
              <div className="stat-item">
                <span>Total Inventory Value:</span>
                <strong>₵{reports.inventory.totalValue?.toFixed(2) || 0}</strong>
              </div>
              <div className="stat-item">
                <span>Low Stock Products:</span>
                <strong>{reports.inventory.lowStockProducts}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div>
            <h2>Top 10 Products</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {reports.topProducts.length === 0 ? (
                  <tr><td colSpan="2">No sales data</td></tr>
                ) : (
                  reports.topProducts.map((product, idx) => (
                    <tr key={idx}>
                      <td>{getProductName(product.product_id)}</td>
                      <td>{product.totalQuantitySold}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
