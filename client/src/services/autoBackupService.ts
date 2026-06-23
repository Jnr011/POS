import { db, type DbBackupRecord } from '../db';

interface IntegrityResult {
  healthy: boolean;
  tableStatuses: Record<string, { ok: boolean; count: number; error?: string }>;
}

type Listener = (result: IntegrityResult) => void;

const TABLES = ['products', 'sales', 'users', 'returns', 'stockAdjustments'] as const;

class AutoBackupService {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private _lastBackupAt: number | null = null;
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(result: IntegrityResult) {
    for (const l of this.listeners) l(result);
  }

  get lastBackupAt() { return this._lastBackupAt; }

  async checkIntegrity(): Promise<IntegrityResult> {
    const tableStatuses: IntegrityResult['tableStatuses'] = {};
    let healthy = true;

    for (const table of TABLES) {
      try {
        const tbl = (db as any)[table];
        if (!tbl || typeof tbl.count !== 'function') {
          tableStatuses[table] = { ok: false, count: 0, error: 'Table not found' };
          healthy = false;
          continue;
        }
        const count = await tbl.count();
        tableStatuses[table] = { ok: true, count };
      } catch (err) {
        tableStatuses[table] = {
          ok: false,
          count: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
        healthy = false;
      }
    }

    const result = { healthy, tableStatuses };
    this.notify(result);
    return result;
  }

  async takeSnapshot(label?: string): Promise<number> {
    const data: Record<string, unknown[]> = {};

    for (const table of TABLES) {
      const tbl = (db as any)[table];
      if (tbl && typeof tbl.toArray === 'function') {
        data[table] = await tbl.toArray();
      }
    }

    const record: Omit<DbBackupRecord, 'id'> = {
      createdAt: Date.now(),
      version: 2,
      label: label || `Auto-backup ${new Date().toLocaleString()}`,
      data: JSON.stringify(data),
    };

    const id = await db.dbBackups.add(record as DbBackupRecord);
    this._lastBackupAt = Date.now();

    // Prune old backups beyond retention
    const retention = await this.getRetention();
    const count = await db.dbBackups.count();
    if (count > retention) {
      const old = await db.dbBackups
        .orderBy('createdAt')
        .limit(count - retention)
        .toArray();
      for (const o of old) {
        if (o.id) await db.dbBackups.delete(o.id);
      }
    }

    return id;
  }

  async getBackups(): Promise<DbBackupRecord[]> {
    return db.dbBackups.orderBy('createdAt').reverse().toArray();
  }

  async restore(backupId: number): Promise<void> {
    const record = await db.dbBackups.get(backupId);
    if (!record) throw new Error('Backup not found');

    const data = JSON.parse(record.data) as Record<string, unknown[]>;

    await db.transaction('rw', TABLES.map(t => (db as any)[t]) as any[], async () => {
      for (const table of TABLES) {
        const records = data[table];
        if (!records || !Array.isArray(records)) continue;
        const tbl = (db as any)[table];
        if (tbl && typeof tbl.clear === 'function') {
          await tbl.clear();
          await tbl.bulkAdd(records);
        }
      }
    });
  }

  async getRetention(): Promise<number> {
    try {
      const val = localStorage.getItem('autoBackupRetention');
      const n = parseInt(val || '5', 10);
      return !isNaN(n) && n > 0 ? n : 5;
    } catch {
      return 5;
    }
  }

  async getInterval(): Promise<number> {
    try {
      const val = localStorage.getItem('autoBackupInterval');
      const n = parseInt(val || '60', 10);
      return !isNaN(n) && n > 0 ? n : 60;
    } catch {
      return 60;
    }
  }

  async setInterval(minutes: number) {
    localStorage.setItem('autoBackupInterval', String(minutes));
  }

  async setRetention(count: number) {
    localStorage.setItem('autoBackupRetention', String(count));
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const interval = await this.getInterval();
    this.intervalTimer = setInterval(async () => {
      try {
        await this.takeSnapshot();
      } catch {
        /* silent */
      }
    }, interval * 60_000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  get running() { return this.isRunning; }
}

export const autoBackupService = new AutoBackupService();
