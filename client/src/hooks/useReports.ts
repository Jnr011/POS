import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { ReportsData } from '../types';

export function useReports() {
  const [reports, setReports] = useState<ReportsData>({
    daily: [], weekly: [], monthly: [],
    topProducts: [], inventory: { totalProducts: 0, totalValue: 0, lowStockProducts: 0 }
  });
  const [productMap, setProductMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [daily, weekly, monthly, topProducts, inventory, productsRes] = await Promise.all([
        API.get<{ dailySales: ReportsData['daily'] }>('/reports/sales/daily'),
        API.get<{ weeklySales: ReportsData['weekly'] }>('/reports/sales/weekly'),
        API.get<{ monthlySales: ReportsData['monthly'] }>('/reports/sales/monthly'),
        API.get<{ topProducts: ReportsData['topProducts'] }>('/reports/top-products'),
        API.get<ReportsData['inventory']>('/reports/inventory/status'),
        API.get<{ products: Array<{ id: number; name: string }> }>('/inventory')
      ]);

      const products = productsRes.data.products || [];
      const map: Record<number, string> = {};
      products.forEach(p => { map[p.id] = p.name; });
      setProductMap(map);

      setReports({
        daily: daily.data.dailySales || [],
        weekly: weekly.data.weeklySales || [],
        monthly: monthly.data.monthlySales || [],
        topProducts: topProducts.data.topProducts || [],
        inventory: (inventory.data || {}) as ReportsData['inventory']
      });
    } catch (err: unknown) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const getProductName = useCallback((id: number) => productMap[id] || `Product #${id}`, [productMap]);

  const refetch = fetchReports;

  return { reports, productMap, getProductName, loading, refetch };
}
