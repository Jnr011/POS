export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  expiry_date?: string | null;
  _pending?: boolean;
}

export interface Sale {
  id: number;
  product_id: number;
  user_id: number;
  quantity: number;
  total_price: number;
  date: string;
  _pending?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'sales';
}

export interface TopProduct {
  product_id: number;
  totalQuantitySold: number;
}

export interface InventoryStatus {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
}

export interface ReportsData {
  daily: Sale[];
  weekly: Sale[];
  monthly: Sale[];
  topProducts: TopProduct[];
  inventory: InventoryStatus;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  table: string;
  recordId: number;
  timestamp: number;
  data: Record<string, unknown> | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
