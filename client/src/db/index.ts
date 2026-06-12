import Dexie, { type Table } from 'dexie';
import { Product, Sale, User, SyncQueueItem, StoreInfo, StockAdjustment } from '../types';
import type { ActivityLogEntry } from '../types/reports';

export interface SyncMeta {
  tableName: string;
  lastSyncedAt: number;
  lastSyncStatus: 'success' | 'error';
  lastErrorMessage?: string;
}

export interface PrintJob {
  id?: number;
  saleId: number;
  receiptData: string;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  createdAt: number;
  retryCount: number;
}

class PharmacyDB extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  users!: Table<User, number>;
  syncMeta!: Table<SyncMeta, string>;
  printJobs!: Table<PrintJob, number>;
  storeInfo!: Table<StoreInfo, string>;
  stockAdjustments!: Table<StockAdjustment, number>;
  activityLog!: Table<ActivityLogEntry, number>;

  constructor() {
    super('PharmacyPOS');

    this.version(2).stores({
      products: '++id, name, category, stock_quantity, updatedAt, syncStatus, deviceId',
      sales: '++id, user_id, date, payment_method, updatedAt, syncStatus, deviceId',
      users: '++id, email, role, syncStatus, deviceId',
      syncQueue: '++id, action, table, recordId, timestamp, retryCount, deviceId',
      syncMeta: 'tableName',
      printJobs: '++id, status, createdAt',
      storeInfo: '&key',
      stockAdjustments: '++id, productId, timestamp',
    });

    this.version(3).stores({
      products: '++id, name, category, stock_quantity, updatedAt, syncStatus, deviceId',
      sales: '++id, user_id, date, payment_method, updatedAt, syncStatus, deviceId',
      users: '++id, email, role, syncStatus, deviceId',
      syncQueue: '++id, action, table, recordId, timestamp, retryCount, deviceId',
      syncMeta: 'tableName',
      printJobs: '++id, status, createdAt',
      storeInfo: '&key',
      stockAdjustments: '++id, productId, timestamp',
      activityLog: '++id, userId, action, timestamp',
    });
  }
}

export const db = new PharmacyDB();
