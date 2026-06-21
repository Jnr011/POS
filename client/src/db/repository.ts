import { db } from './index';
import { activityLogger } from './activityLogger';
import { buildTrendData } from '../lib/trendBuilder';
import { Product, Sale, User, CartItem, StockAdjustment, ReturnRecord, ReturnItem } from '../types';
import type {
  SalesTrendPoint,
  ProductPerformance,
  PaymentBreakdown,
  AttendantPerformance,
  InventoryValuation,
  ReportSummary,
  TrendPreset,
} from '../types/reports';

let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
  try {
    deviceId = crypto.randomUUID();
  } catch {
    deviceId = 'pos-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  localStorage.setItem('deviceId', deviceId);
}

export function generatePin(): string {
  const digits = '0123456789';
  let pin = '';
  for (let i = 0; i < 5; i++) {
    pin += digits[Math.floor(Math.random() * digits.length)];
  }
  return pin;
}

function getDeviceId(): string {
  return deviceId!;
}

function now(): number {
  return Date.now();
}

async function queueSync(
  action: 'create' | 'update' | 'delete',
  table: string,
  recordId: number,
  data: Record<string, unknown> | null
): Promise<void> {
  await db.syncQueue.add({
    action,
    table,
    recordId,
    timestamp: now(),
    data,
    retryCount: 0,
    deviceId: getDeviceId(),
  });
}

export const ProductRepository = {
  async getAll(): Promise<Product[]> {
    return db.products.orderBy('name').toArray();
  },

  async getById(id: number): Promise<Product | undefined> {
    return db.products.get(id);
  },

  async search(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    return db.products
      .filter(p => p.name.toLowerCase().includes(q) || (p.barcode?.includes(q)))
      .toArray();
  },

  async getByCategory(category: string): Promise<Product[]> {
    if (!category) return this.getAll();
    return db.products.where('category').equals(category).toArray();
  },

  async getLowStock(threshold?: number): Promise<Product[]> {
    const t = threshold ?? 10;
    return db.products.filter(p => p.stock_quantity <= t).toArray();
  },

  async getExpiringSoon(days = 30): Promise<Product[]> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return db.products
      .filter(p => p.expiry_date && new Date(p.expiry_date) <= deadline)
      .toArray();
  },

  async getCategories(): Promise<string[]> {
    const products = await db.products.toArray();
    return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  },

  async add(product: Omit<Product, 'id' | 'updatedAt' | 'syncedAt' | 'syncStatus' | 'deviceId'>): Promise<Product> {
    const entry: Product = {
      ...product,
      updatedAt: now(),
      syncStatus: 'pending',
      deviceId: getDeviceId(),
    };
    const id = await db.products.add(entry);
    await queueSync('create', 'products', id, entry as unknown as Record<string, unknown>);
    activityLogger.log('product_add', `Added product "${data.name}"`, { productId: id, name: data.name, category: data.category });
    return { ...entry, id };
  },

  async update(id: number, data: Partial<Product>): Promise<void> {
    const existing = await db.products.get(id);
    if (!existing) throw new Error(`Product ${id} not found`);
    const updates: Partial<Product> = {
      ...data,
      updatedAt: now(),
      syncStatus: 'pending',
    };
    await db.products.update(id, updates);
    await queueSync('update', 'products', id, updates as unknown as Record<string, unknown>);
    activityLogger.log('product_edit', `Updated product "${existing.name}"`, { productId: id, name: existing.name, changes: Object.keys(data) });
  },

  async delete(id: number): Promise<void> {
    const existing = await db.products.get(id);
    await db.products.delete(id);
    await queueSync('delete', 'products', id, null);
    activityLogger.log('product_delete', `Deleted product "${existing?.name ?? id}"`, { productId: id, name: existing?.name });
  },

  async adjustStock(id: number, delta: number, reason: string, userId: number): Promise<void> {
    const product = await db.products.get(id);
    if (!product) throw new Error('Product not found');
    const newQty = (product.stock_quantity || 0) + delta;
    if (newQty < 0) throw new Error('Insufficient stock');
    const previousQty = product.stock_quantity;
    await db.products.update(id, {
      stock_quantity: newQty,
      updatedAt: now(),
      syncStatus: 'pending',
    });
    await db.stockAdjustments.add({
      productId: id,
      delta,
      reason,
      previousQty,
      newQty,
      userId,
      timestamp: now(),
    });
    await queueSync('update', 'products', id, { stock_quantity: newQty } as unknown as Record<string, unknown>);
    activityLogger.log('stock_adjust', `Adjusted "${product.name}" by ${delta > 0 ? '+' : ''}${delta} (${reason})`, {
      productId: id, name: product.name, delta, reason, previousQty, newQty,
    });
  },

  async batchImport(products: Omit<Product, 'id' | 'updatedAt' | 'syncedAt' | 'syncStatus' | 'deviceId'>[]): Promise<number> {
    const now_ = now();
    const toAdd = products.map(p => ({
      ...p,
      updatedAt: now_,
      syncStatus: 'pending' as const,
      deviceId: getDeviceId(),
    }));
    const ids = await db.products.bulkAdd(toAdd, { allKeys: true });
    for (let i = 0; i < toAdd.length; i++) {
      await queueSync('create', 'products', ids[i] as number, toAdd[i] as unknown as Record<string, unknown>);
    }
    activityLogger.log('csv_import', `Imported ${ids.length} products via CSV`, { count: ids.length });
    return ids.length;
  },
};

export const SaleRepository = {
  async getAll(): Promise<Sale[]> {
    return db.sales.orderBy('date').reverse().toArray();
  },

  async getById(id: number): Promise<Sale | undefined> {
    return db.sales.get(id);
  },

  async getByUser(userId: number): Promise<Sale[]> {
    return db.sales.where('user_id').equals(userId).reverse().toArray();
  },

  async getByDateRange(from: Date, to: Date): Promise<Sale[]> {
    const fromStr = from.toISOString();
    const toStr = to.toISOString();
    return db.sales
      .filter(s => s.date >= fromStr && s.date <= toStr)
      .reverse()
      .toArray();
  },

  async getByDate(dateStr: string): Promise<Sale[]> {
    return db.sales
      .filter(s => s.date.startsWith(dateStr))
      .reverse()
      .toArray();
  },

  async processSale(
    cart: CartItem[],
    userId: number,
    paymentMethod: 'cash' | 'card' | 'mobile_money',
    amountTendered: number
  ): Promise<Sale> {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = await getTaxRate();
    const tax = totalPrice * taxRate;
    const grandTotal = totalPrice + tax;
    const changeDue = Math.max(0, amountTendered - grandTotal);

    return db.transaction('rw', db.sales, db.products, db.syncQueue, db.activityLog, async () => {
      for (const item of cart) {
        const product = await db.products.get(item.id);
        if (!product) throw new Error(`Product "${item.name}" not found`);
        const newStock = (product.stock_quantity ?? 0) - item.quantity;
        if (newStock < 0) throw new Error(`Insufficient stock for "${item.name}"`);
        await db.products.update(item.id, {
          stock_quantity: newStock,
          updatedAt: now(),
          syncStatus: 'pending',
        });
        await queueSync('update', 'products', item.id, { stock_quantity: newStock } as unknown as Record<string, unknown>);
      }

      const sale: Sale = {
        user_id: userId,
        items: cart,
        total_price: totalPrice,
        tax,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        amount_tendered: amountTendered,
        change_due: changeDue,
        date: new Date().toISOString(),
        updatedAt: now(),
        syncStatus: 'pending',
        status: 'pending',
        deviceId: getDeviceId(),
      };

      const id = await db.sales.add(sale as Sale);
      await queueSync('create', 'sales', id, sale as unknown as Record<string, unknown>);

      activityLogger.log('sale', `Sale #${id} — ${cart.length} items, ${grandTotal.toFixed(2)}`, {
        saleId: id,
        itemCount: cart.length,
        grandTotal,
        paymentMethod,
      });

      return { ...sale, id };
    });
  },
};

export const UserRepository = {
  async getAll(): Promise<User[]> {
    return db.users.toArray();
  },

  async getById(id: number): Promise<User | undefined> {
    const user = await db.users.get(id);
    return user as User | undefined;
  },

  async getByEmail(email: string): Promise<User | undefined> {
    const user = await db.users.filter(u => u.email === email).first();
    if (user) {
      console.log('[UserRepo.getByEmail] Found:', { id: user.id, mustChangePin: (user as any).mustChangePin, name: user.name });
    }
    return user as User | undefined;
  },

  async getByPinHash(pinHash: string): Promise<User | undefined> {
    const user = await db.users.filter(u => u.pinHash === pinHash && u.role === 'sales').first();
    return user as User | undefined;
  },

  async add(user: Omit<User, 'id' | 'updatedAt' | 'syncedAt' | 'syncStatus' | 'deviceId'>): Promise<User> {
    const entry: User = {
      ...user,
      mustChangePin: user.mustChangePin ?? false,
      updatedAt: now(),
      syncStatus: 'pending',
      deviceId: getDeviceId(),
    };
    console.log('[UserRepo.add] Storing:', { name: entry.name, mustChangePin: entry.mustChangePin, role: entry.role });
    const id = await db.users.add(entry);
    const verify = await db.users.get(id);
    console.log('[UserRepo.add] Verified from DB:', { id, mustChangePin: verify?.mustChangePin });
    await queueSync('create', 'users', id, entry as unknown as Record<string, unknown>);
    activityLogger.log('user_add', `Added user "${user.name}" (${user.role})`, { userId: id, name: user.name, role: user.role });
    return { ...entry, id } as User;
  },

  async update(id: number, data: Partial<User>): Promise<void> {
    const updates: Partial<User> = {
      ...data,
      updatedAt: now(),
      syncStatus: 'pending',
    };
    await db.users.update(id, updates);
    await queueSync('update', 'users', id, updates as unknown as Record<string, unknown>);
  },

  async deactivate(id: number): Promise<void> {
    await this.update(id, { isActive: false });
    const user = await db.users.get(id);
    activityLogger.log('user_deactivate', `Deactivated user "${user?.name ?? id}"`, { userId: id, name: user?.name });
  },

  async updatePin(id: number, newPinHash: string): Promise<void> {
    await this.update(id, { pinHash: newPinHash, mustChangePin: false } as Partial<User>);
  },

  async getAdminCount(): Promise<number> {
    return db.users.filter(u => u.role === 'admin').count();
  },
};

export const CategoryRepository = {
  async getAll(): Promise<string[]> {
    const entry = await db.storeInfo.get('categories');
    if (!entry?.value) {
      const fromProducts = await ProductRepository.getCategories();
      if (fromProducts.length > 0) {
        await db.storeInfo.put({ key: 'categories', value: JSON.stringify(fromProducts) });
      }
      return fromProducts;
    }
    try {
      return JSON.parse(entry.value);
    } catch {
      return [];
    }
  },

  async add(name: string): Promise<string[]> {
    const cats = await this.getAll();
    if (cats.includes(name)) return cats;
    const updated = [...cats, name].sort();
    await db.storeInfo.put({ key: 'categories', value: JSON.stringify(updated) });
    return updated;
  },

  async remove(name: string): Promise<string[]> {
    const cats = await this.getAll();
    const updated = cats.filter(c => c !== name);
    await db.storeInfo.put({ key: 'categories', value: JSON.stringify(updated) });
    return updated;
  },

  async rename(oldName: string, newName: string): Promise<string[]> {
    const cats = await this.getAll();
    const updated = cats.map(c => c === oldName ? newName : c).sort();
    await db.storeInfo.put({ key: 'categories', value: JSON.stringify(updated) });
    return updated;
  },
};

export const StoreRepository = {
  async get(key: string): Promise<string | undefined> {
    const entry = await db.storeInfo.get(key);
    return entry?.value;
  },

  async set(key: string, value: string): Promise<void> {
    await db.storeInfo.put({ key, value });
  },

  async getAll(): Promise<Record<string, string>> {
    const entries = await db.storeInfo.toArray();
    const result: Record<string, string> = {};
    for (const e of entries) result[e.key] = e.value;
    return result;
  },
};

export const ReportsRepository = {
  async getReportSummary(from: Date, to: Date): Promise<ReportSummary> {
    const sales = await this.getSalesByDateRange(from, to);
    const totalRevenue = sales.reduce((sum, s) => sum + s.grand_total, 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = new Date(from.getTime());
    const prevSales = await this.getSalesByDateRange(prevFrom, prevTo);
    const prevRevenue = prevSales.reduce((sum, s) => sum + s.grand_total, 0);
    const prevOrders = prevSales.length;

    const revenueChange = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;
    const ordersChange = prevOrders > 0
      ? ((totalOrders - prevOrders) / prevOrders) * 100
      : totalOrders > 0 ? 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, revenueChange, ordersChange };
  },

  async getSalesByDateRange(from: Date, to: Date): Promise<Sale[]> {
    const fromMs = from.getTime();
    const toMs = to.getTime() + 86400000;
    return db.sales
      .filter(s => {
        const ts = new Date(s.date).getTime();
        return ts >= fromMs && ts < toMs;
      })
      .toArray();
  },

  async getSalesTrend(
    preset: TrendPreset,
    from: Date,
    to: Date,
  ): Promise<SalesTrendPoint[]> {
    const sales = await this.getSalesByDateRange(from, to);
    const raw = sales.map(s => ({ date: s.date, grand_total: s.grand_total }));
    return buildTrendData(preset, raw);
  },

  async getProductPerformance(
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<ProductPerformance[]> {
    const sales = await this.getSalesByDateRange(from, to);
    const productMap = new Map<number, { name: string; category: string; sold: number; revenue: number }>();
    let totalRevenue = 0;

    for (const sale of sales) {
      if (!Array.isArray(sale.items)) continue;
      for (const item of sale.items) {
        if (!item || item.id == null) continue;
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        if (qty <= 0) continue;

        const existing = productMap.get(item.id) || {
          name: item.name || `Product #${item.id}`,
          category: item.category || '',
          sold: 0,
          revenue: 0,
        };
        existing.sold += qty;
        existing.revenue += price * qty;
        productMap.set(item.id, existing);
        totalRevenue += price * qty;
      }
    }

    if (productMap.size === 0) {
      return [];
    }

    return [...productMap.entries()]
      .map(([id, data]) => ({
        productId: id,
        name: data.name,
        category: data.category,
        totalSold: data.sold,
        revenue: data.revenue,
        percentOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.totalSold - a.totalSold)
      .slice(0, limit);
  },

  async getPaymentBreakdown(from: Date, to: Date): Promise<PaymentBreakdown[]> {
    const sales = await this.getSalesByDateRange(from, to);
    const total = sales.length;
    const breakdown = new Map<string, { count: number; total: number }>();

    for (const sale of sales) {
      const existing = breakdown.get(sale.payment_method) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += sale.grand_total;
      breakdown.set(sale.payment_method, existing);
    }

    return [...breakdown.entries()].map(([method, data]) => ({
      method: method as 'cash' | 'card' | 'mobile_money',
      count: data.count,
      total: data.total,
      percent: total > 0 ? (data.count / total) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  },

  async getSalesByAttendant(from: Date, to: Date): Promise<AttendantPerformance[]> {
    const sales = await this.getSalesByDateRange(from, to);
    const userMap = new Map<number, { name: string; count: number; revenue: number }>();
    const users = await db.users.toArray();
    const userNames = new Map(users.map(u => [u.id, u.name]));

    for (const sale of sales) {
      const existing = userMap.get(sale.user_id) || {
        name: userNames.get(sale.user_id) || `User #${sale.user_id}`,
        count: 0,
        revenue: 0,
      };
      existing.count += 1;
      existing.revenue += sale.grand_total;
      userMap.set(sale.user_id, existing);
    }

    return [...userMap.entries()].map(([userId, data]) => ({
      userId,
      name: data.name,
      salesCount: data.count,
      totalRevenue: data.revenue,
      avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  async getInventoryValuation(): Promise<InventoryValuation> {
    const products = await db.products.toArray();
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock_quantity <= (p.min_stock ?? 10)).length;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    const expiringSoonCount = products.filter(
      p => p.expiry_date && new Date(p.expiry_date) <= deadline,
    ).length;

    const categoryMap = new Map<string, { value: number; count: number }>();
    for (const p of products) {
      const existing = categoryMap.get(p.category) || { value: 0, count: 0 };
      existing.value += p.price * p.stock_quantity;
      existing.count += 1;
      categoryMap.set(p.category, existing);
    }

    const byCategory = [...categoryMap.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);

    return { totalValue, totalProducts, lowStockCount, expiringSoonCount, byCategory };
  },

  async getTopProducts(limit = 10): Promise<{ productId: number; name: string; totalSold: number }[]> {
    const sales = await db.sales.toArray();
    const productMap = new Map<number, number>();
    for (const sale of sales) {
      for (const item of sale.items || []) {
        productMap.set(item.id, (productMap.get(item.id) || 0) + item.quantity);
      }
    }
    const sorted = [...productMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    const result: { productId: number; name: string; totalSold: number }[] = [];
    for (const [productId, totalSold] of sorted) {
      const product = await db.products.get(productId);
      result.push({ productId, name: product?.name || `Product #${productId}`, totalSold });
    }
    return result;
  },

  async getSalesByPeriod(
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<{ date: string; total: number; count: number }[]> {
    const sales = await db.sales.toArray();
    const now_ = new Date();
    const grouped = new Map<string, { total: number; count: number }>();

    let periodStart: Date;
    if (period === 'daily') {
      periodStart = new Date(now_.getFullYear(), now_.getMonth(), now_.getDate() - 7);
    } else if (period === 'weekly') {
      periodStart = new Date(now_.getFullYear(), now_.getMonth(), now_.getDate() - 28);
    } else {
      periodStart = new Date(now_.getFullYear() - 1, now_.getMonth(), now_.getDate());
    }

    for (const sale of sales) {
      const saleDate = new Date(sale.date);
      if (saleDate < periodStart) continue;

      let key: string;
      if (period === 'daily') {
        key = sale.date.split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(saleDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = grouped.get(key) || { total: 0, count: 0 };
      existing.total += sale.grand_total;
      existing.count += 1;
      grouped.set(key, existing);
    }

    return [...grouped.entries()]
      .map(([date, { total, count }]) => ({ date, total, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

export const ReturnRepository = {
  async getAll(): Promise<ReturnRecord[]> {
    return db.returns.orderBy('date').reverse().toArray();
  },

  async processReturn(
    saleId: number,
    userId: number,
    items: ReturnItem[],
  ): Promise<ReturnRecord> {
    const refundTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return db.transaction('rw', db.returns, db.products, db.syncQueue, db.activityLog, async () => {
      for (const item of items) {
        const product = await db.products.get(item.productId);
        if (product) {
          const newStock = (product.stock_quantity ?? 0) + item.quantity;
          await db.products.update(item.productId, {
            stock_quantity: newStock,
            updatedAt: now(),
            syncStatus: 'pending',
          });
          await queueSync('update', 'products', item.productId, { stock_quantity: newStock } as unknown as Record<string, unknown>);
        }
      }

      const record: ReturnRecord = {
        saleId,
        userId,
        items,
        refundTotal,
        date: new Date().toISOString(),
        updatedAt: now(),
        syncStatus: 'pending',
        deviceId: getDeviceId(),
      };

      const id = await db.returns.add(record as ReturnRecord);
      await queueSync('create', 'returns', id, record as unknown as Record<string, unknown>);

      activityLogger.log('return', `Return processed for Sale #${saleId} — ${items.length} items, ${refundTotal.toFixed(2)} refunded`, {
        saleId, returnId: id, itemCount: items.length, refundTotal,
      });

      return { ...record, id };
    });
  },

  async isReturnsAllowed(): Promise<boolean> {
    try {
      const val = await StoreRepository.get('allowReturns');
      return val !== 'false';
    } catch {
      return true;
    }
  },
};

async function getTaxRate(): Promise<number> {
  const rate = await db.storeInfo.get('taxRate');
  return rate ? parseFloat(rate.value) / 100 : 0.1;
}
