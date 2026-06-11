import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export function useReports() {
  const [reports, setReports] = useState({
    daily: [], weekly: [], monthly: [],
    topProducts: [], inventory: {}
  });
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [daily, weekly, monthly, topProducts, inventory, productsRes] = await Promise.all([
        API.get('/reports/sales/daily'),
        API.get('/reports/sales/weekly'),
        API.get('/reports/sales/monthly'),
        API.get('/reports/top-products'),
        API.get('/reports/inventory/status'),
        API.get('/inventory')
      ]);

      const products = productsRes.data.products || [];
      const map = {};
      products.forEach(p => { map[p.id] = p.name; });
      setProductMap(map);

      setReports({
        daily: daily.data.dailySales || [],
        weekly: weekly.data.weeklySales || [],
        monthly: monthly.data.monthlySales || [],
        topProducts: topProducts.data.topProducts || [],
        inventory: inventory.data || {}
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const getProductName = useCallback((id) => productMap[id] || `Product #${id}`, [productMap]);

  const refetch = fetchReports;

  return { reports, productMap, getProductName, loading, refetch };
}
