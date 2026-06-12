import { useState, useEffect, useCallback } from 'react';
import { ReportsRepository } from '../db/repository';
import { db } from '../db';
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

      const [
        dailySales,
        weeklySales,
        monthlySales,
        topProducts,
        inventoryTotal,
        lowStock,
        products,
      ] = await Promise.all([
        db.sales.filter(s => {
          const today = new Date().toISOString().split('T')[0];
          return s.date.startsWith(today);
        }).toArray(),
        db.sales.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.date) >= weekAgo;
        }).toArray(),
        db.sales.filter(s => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return new Date(s.date) >= monthAgo;
        }).toArray(),
        ReportsRepository.getTopProducts(10),
        ReportsRepository.getInventoryValue(),
        ReportsRepository.getLowStockCount(),
        db.products.toArray(),
      ]);

      const map: Record<number, string> = {};
      products.forEach(p => { map[p.id] = p.name; });
      setProductMap(map);

      setReports({
        daily: dailySales,
        weekly: weeklySales,
        monthly: monthlySales,
        topProducts: topProducts.map(p => ({
          product_id: p.productId,
          totalQuantitySold: p.totalSold,
        })),
        inventory: {
          totalProducts: products.length,
          totalValue: inventoryTotal,
          lowStockProducts: lowStock,
        },
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const getProductName = useCallback((id: number) => productMap[id] || `Product #${id}`, [productMap]);

  return { reports, productMap, getProductName, loading, refetch: fetchReports };
}
