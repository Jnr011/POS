export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  expiry_date?: string | null;
  barcode?: string;
  min_stock?: number;
  supplier?: string;
  updatedAt: number;
  syncedAt?: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  deviceId?: string;
}

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  quantity: number;
}

export interface Sale {
  id: number;
  user_id: number;
  items: CartItem[];
  total_price: number;
  tax: number;
  grand_total: number;
  payment_method: 'cash' | 'card' | 'mobile_money';
  amount_tendered: number;
  change_due: number;
  date: string;
  updatedAt: number;
  syncedAt?: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  status: 'completed' | 'pending';
  deviceId?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'sales';
  pinHash: string;
  mustChangePin?: boolean;
  isActive: boolean;
  updatedAt: number;
  syncedAt?: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  deviceId?: string;
}

export interface StoreInfo {
  key: string;
  value: string;
}

export interface StockAdjustment {
  id?: number;
  productId: number;
  delta: number;
  reason: string;
  previousQty: number;
  newQty: number;
  userId: number;
  timestamp: number;
  syncedAt?: number;
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
  retryCount?: number;
  deviceId?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ReturnItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
}

export interface ReturnRecord {
  id?: number;
  saleId: number;
  userId: number;
  items: ReturnItem[];
  refundTotal: number;
  date: string;
  updatedAt: number;
  syncedAt?: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  deviceId?: string;
}
