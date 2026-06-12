import { db } from './index';
import { Product, Sale, User, CartItem, StockAdjustment } from '../types';

let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
  deviceId = 'pos-' + crypto.randomUUID().slice(0, 8);
  localStorage.setItem('deviceId', deviceId);
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
  },

  async delete(id: number): Promise<void> {
    await db.products.delete(id);
    await queueSync('delete', 'products', id, null);
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

    return db.transaction('rw', db.sales, db.products, db.syncQueue, async () => {
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
        deviceId: getDeviceId(),
      };

      const id = await db.sales.add(sale as Sale);
      await queueSync('create', 'sales', id, sale as unknown as Record<string, unknown>);
      return { ...sale, id };
    });
  },
};

export const UserRepository = {
  async getAll(): Promise<User[]> {
    return db.users.toArray();
  },

  async getById(id: number): Promise<User | undefined> {
    return db.users.get(id);
  },

  async getByEmail(email: string): Promise<User | undefined> {
    return db.users.filter(u => u.email === email).first();
  },

  async getByPinHash(pinHash: string): Promise<User | undefined> {
    return db.users.filter(u => u.pinHash === pinHash && u.role === 'sales').first();
  },

  async add(user: Omit<User, 'id' | 'updatedAt' | 'syncedAt' | 'syncStatus' | 'deviceId'>): Promise<User> {
    const entry: User = {
      ...user,
      updatedAt: now(),
      syncStatus: 'pending',
      deviceId: getDeviceId(),
    };
    const id = await db.users.add(entry);
    await queueSync('create', 'users', id, entry as unknown as Record<string, unknown>);
    return { ...entry, id };
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
  async getTodaySalesTotal(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const sales = await db.sales.filter(s => s.date.startsWith(today)).toArray();
    return sales.reduce((sum, s) => sum + s.grand_total, 0);
  },

  async getTodaySalesCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return db.sales.filter(s => s.date.startsWith(today)).count();
  },

  async getInventoryValue(): Promise<number> {
    const products = await db.products.toArray();
    return products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  },

  async getLowStockCount(threshold = 10): Promise<number> {
    return db.products.filter(p => p.stock_quantity <= threshold).count();
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

async function getTaxRate(): Promise<number> {
  const rate = await db.storeInfo.get('taxRate');
  return rate ? parseFloat(rate.value) / 100 : 0.1;
}
