import Dexie from 'dexie';

export const db = new Dexie('PharmacyPOS');

db.version(1).stores({
  products: '++id, name, category, stock_quantity',
  sales: '++id, product_id, user_id, date',
  syncQueue: '++id, action, table, recordId, timestamp',
  users: '++id, email, role',
});
