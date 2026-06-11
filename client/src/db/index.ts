import Dexie, { type Table } from 'dexie';
import { Product, Sale, SyncQueueItem, User } from '../types';

class PharmacyDB extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  users!: Table<User, number>;

  constructor() {
    super('PharmacyPOS');
    this.version(1).stores({
      products: '++id, name, category, stock_quantity',
      sales: '++id, product_id, user_id, date',
      syncQueue: '++id, action, table, recordId, timestamp',
      users: '++id, email, role',
    });
  }
}

export const db = new PharmacyDB();
