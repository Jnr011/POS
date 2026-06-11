import API from '../services/api';
import { db } from './index';

export const ProductRepository = {
  async getAll() {
    if (navigator.onLine) {
      const res = await API.get('/inventory');
      const products = res.data.products || [];
      await db.products.clear();
      await db.products.bulkAdd(products);
      return products;
    }
    return await db.products.toArray();
  },

  async add(product) {
    if (navigator.onLine) {
      const res = await API.post('/inventory', product);
      return res.data.product;
    }
    const id = await db.products.add({ ...product, _pending: true });
    await db.syncQueue.add({
      action: 'create', table: 'products', recordId: id, timestamp: Date.now(), data: product
    });
    return { ...product, id, _pending: true };
  },

  async update(id, data) {
    if (navigator.onLine) {
      const res = await API.put(`/inventory/${id}`, data);
      return res.data.product;
    }
    await db.products.update(id, { ...data, _pending: true });
    await db.syncQueue.add({
      action: 'update', table: 'products', recordId: id, timestamp: Date.now(), data
    });
    return { ...data, id, _pending: true };
  },

  async delete(id) {
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
  async getAll() {
    if (navigator.onLine) {
      const res = await API.get('/sales');
      const sales = res.data.sales || [];
      await db.sales.clear();
      await db.sales.bulkAdd(sales);
      return sales;
    }
    return await db.sales.toArray();
  },

  async add(saleData) {
    if (navigator.onLine) {
      const res = await API.post('/sales', saleData);
      return res.data.sale;
    }
    const id = await db.sales.add({
      ...saleData, _pending: true, date: new Date().toISOString()
    });
    await db.syncQueue.add({
      action: 'create', table: 'sales', recordId: id, timestamp: Date.now(), data: saleData
    });
    return { ...saleData, id, _pending: true };
  }
};
