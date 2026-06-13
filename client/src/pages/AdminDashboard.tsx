import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportsRepository, ProductRepository } from '../db/repository';
import { buildTrendData } from '../lib/trendBuilder';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/ui/skeleton';
import {
  DashboardStatCards,
  SalesTrendMini,
  TopProductsMini,
  QuickActions,
  RecentTransactions,
  LowStockAlert,
} from '../components/dashboard';
import { LayoutDashboard } from 'lucide-react';
import type { Product, Sale } from '../types';
import type { SalesTrendPoint, ProductPerformance } from '../types/reports';

function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [revenueToday, setRevenueToday] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const [
          summary,
          rawTrend,
          topProds,
          inventory,
          lowStock,
          expiring,
          todaySales,
        ] = await Promise.all([
          ReportsRepository.getReportSummary(todayStart, now),
          ReportsRepository.getSalesByDateRange(weekAgo, now),
          ReportsRepository.getProductPerformance(weekAgo, now, 5),
          ReportsRepository.getInventoryValuation(),
          ProductRepository.getLowStock(),
          ProductRepository.getExpiringSoon(30),
          ReportsRepository.getSalesByDateRange(todayStart, now),
        ]);

        if (cancelled) return;

        const raw = rawTrend.map(s => ({ date: s.date, grand_total: s.grand_total }));
        const trendData = buildTrendData('last_7_days', raw);

        setRevenueToday(summary.totalRevenue);
        setOrdersToday(summary.totalOrders);
        setLowStockCount(inventory.lowStockCount);
        setInventoryValue(inventory.totalValue);
        setTrend(trendData);
        setTopProducts(topProds);
        setRecentSales(todaySales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLowStockProducts(lowStock);
        setExpiringProducts(expiring);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[280px]" />
          <Skeleton className="h-[280px]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[240px]" />
          <Skeleton className="h-[240px]" />
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<LayoutDashboard className="size-4 text-primary" />}
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="Here's your pharmacy overview"
      />

      <div data-tour="dashboard-stats">
        <DashboardStatCards
          revenueToday={revenueToday}
          ordersToday={ordersToday}
          lowStockCount={lowStockCount}
          inventoryValue={inventoryValue}
          onLowStockClick={() => navigate('/inventory')}
        />
      </div>

      <div data-tour="dashboard-chart" className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SalesTrendMini data={trend} />
        <TopProductsMini data={topProducts} />
      </div>

      <div data-tour="dashboard-actions">
        <QuickActions />
      </div>

      <div data-tour="dashboard-transactions" className="grid gap-4 lg:grid-cols-2">
        <RecentTransactions data={recentSales} />
        <LowStockAlert
          lowStockProducts={lowStockProducts}
          expiringProducts={expiringProducts}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;
