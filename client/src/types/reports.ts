export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductPerformance {
  productId: number;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  percentOfTotal: number;
}

export interface PaymentBreakdown {
  method: 'cash' | 'card' | 'mobile_money';
  count: number;
  total: number;
  percent: number;
}

export interface AttendantPerformance {
  userId: number;
  name: string;
  salesCount: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface InventoryCategoryValue {
  category: string;
  value: number;
  count: number;
}

export interface InventoryValuation {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  expiringSoonCount: number;
  byCategory: InventoryCategoryValue[];
}

export interface ActivityLogEntry {
  id?: number;
  userId: number;
  userName: string;
  action:
    | 'sale'
    | 'return'
    | 'stock_adjust'
    | 'product_add'
    | 'product_edit'
    | 'product_delete'
    | 'user_add'
    | 'user_deactivate'
    | 'csv_import'
    | 'login'
    | 'logout';
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueChange: number;
  ordersChange: number;
}
