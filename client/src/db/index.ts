import Dexie, { type Table } from 'dexie';
import { Product, Sale, User, SyncQueueItem, StoreInfo, StockAdjustment, ReturnRecord } from '../types';
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

export interface DbBackupRecord {
  id?: number;
  createdAt: number;
  version: number;
  label: string;
  data: string;
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
  returns!: Table<ReturnRecord, number>;
  dbBackups!: Table<DbBackupRecord, number>;

  constructor() {
    super('PharmacyPOS');

    this.version(7).stores({
      products: '++id, name, category, stock_quantity, updatedAt, syncStatus, deviceId',
      sales: '++id, user_id, date, payment_method, updatedAt, syncStatus, deviceId, status',
      users: '++id, email, role, syncStatus, deviceId, mustChangePin',
      syncQueue: '++id, action, table, recordId, timestamp, retryCount, deviceId',
      syncMeta: 'tableName',
      printJobs: '++id, status, createdAt',
      storeInfo: '&key',
      stockAdjustments: '++id, productId, timestamp',
      activityLog: '++id, userId, action, timestamp',
      returns: '++id, saleId, userId, date, syncStatus, deviceId',
      dbBackups: '++id, createdAt',
    }).upgrade(async (tx) => {
      await tx.table('sales').toCollection().modify(s => {
        if (s.status === undefined) s.status = 'completed';
      });
      await tx.table('products').toCollection().modify(p => {
        if (p.syncStatus === undefined) p.syncStatus = 'pending';
      });
    });
  }
}

export const db = new PharmacyDB();
