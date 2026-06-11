import API from '../services/api';
import { db } from './index';
import { Product, Sale } from '../types';

export const ProductRepository = {
  async getAll(): Promise<Product[]> {
    if (navigator.onLine) {
      const res = await API.get<{ products: Product[] }>('/inventory');
      const products = res.data.products || [];
      await db.products.clear();
      await db.products.bulkAdd(products);
      return products;
    }
    return await db.products.toArray();
  },

  async add(product: Omit<Product, 'id'>): Promise<Product> {
    if (navigator.onLine) {
      const res = await API.post<{ product: Product }>('/inventory', product);
      return res.data.product;
    }
    const id = await db.products.add({ ...product, _pending: true } as Product);
    await db.syncQueue.add({
      action: 'create', table: 'products', recordId: id, timestamp: Date.now(), data: product as Record<string, unknown>
    });
    return { ...product, id, _pending: true } as Product;
  },

  async update(id: number, data: Partial<Product>): Promise<Product> {
    if (navigator.onLine) {
      const res = await API.put<{ product: Product }>(`/inventory/${id}`, data);
      return res.data.product;
    }
    await db.products.update(id, { ...data, _pending: true });
    await db.syncQueue.add({
      action: 'update', table: 'products', recordId: id, timestamp: Date.now(), data: data as Record<string, unknown>
    });
    return { ...data, id, _pending: true } as Product;
  },

  async delete(id: number): Promise<void> {
    if (navigator.onLine) {
      await API.delete(`/inventory/${id}`);
      return;
    }
    await db.products.delete(id);
    await db.syncQueue.add({
      action: 'delete', table: 'products', recordId: id, timestamp: Date.now(), data: null
    });
  }
};

export const SaleRepository = {
  async getAll(): Promise<Sale[]> {
    if (navigator.onLine) {
      const res = await API.get<{ sales: Sale[] }>('/sales');
      const sales = res.data.sales || [];
      await db.sales.clear();
      await db.sales.bulkAdd(sales);
      return sales;
    }
    return await db.sales.toArray();
  },

  async add(saleData: Partial<Omit<Sale, 'id'>>): Promise<Sale> {
    if (navigator.onLine) {
      const res = await API.post<{ sale: Sale }>('/sales', saleData);
      return res.data.sale;
    }
    const id = await db.sales.add({
      ...saleData, _pending: true, date: new Date().toISOString()
    } as Sale);
    await db.syncQueue.add({
      action: 'create', table: 'sales', recordId: id, timestamp: Date.now(), data: saleData as Record<string, unknown>
    });
    return { ...saleData, id, _pending: true } as Sale;
  }
};
