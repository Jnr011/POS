import { db } from '../db';
import { StoreRepository } from '../db/repository';
import type { SyncBatchItem, SyncPushResponse, SyncPullResponse, SyncStatus } from '../types/sync';

const DEFAULT_RELAY_URL = 'http://localhost:5000/api/sync';

function getDeviceId(): string {
  return localStorage.getItem('deviceId') || 'pos-unknown';
}

function getDeviceToken(): string | null {
  return localStorage.getItem('deviceToken');
}

type StatusListener = (status: SyncStatus) => void;

class SyncService {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private _isSyncing = false;
  private _pendingPushes = 0;
  private _lastSyncedAt: number | null = null;
  private _lastError: string | null = null;
  private _relayConnected = false;
  private _online = navigator.onLine;
  private listeners: Set<StatusListener> = new Set();
  private destroyHandlers: (() => void)[] = [];
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryAttempts = 0;

  private relayUrl = DEFAULT_RELAY_URL;

  getStatus(): SyncStatus {
    return {
      pendingPushes: this._pendingPushes,
      lastSyncedAt: this._lastSyncedAt,
      isSyncing: this._isSyncing,
      lastErrorMessage: this._lastError,
      relayConnected: this._relayConnected,
    };
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  async initialize(): Promise<void> {
    const storedUrl = await StoreRepository.get('relayUrl');
    if (storedUrl) this.relayUrl = storedUrl;

    this._online = navigator.onLine;
    this.updatePendingCount();
    this.notify();

    const onOnline = () => {
      this._online = true;
      this._lastError = null;
      this.notify();
      this.resumeFromSettings();
    };

    const onOffline = () => {
      this._online = false;
      this._relayConnected = false;
      this.clearRetry();
      this.stopInterval();
      this.notify();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    this.destroyHandlers.push(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });

    if (this._online) {
      this.resumeFromSettings();
    }
  }

  private async resumeFromSettings() {
    const enabled = await StoreRepository.get('autoSyncEnabled');
    if (enabled === 'true') {
      const intervalStr = await StoreRepository.get('autoSyncInterval');
      const interval = parseInt(intervalStr || '5', 10);
      if (!isNaN(interval) && interval > 0) {
        this.startInterval(interval);
      }
      this.doSync();
    }
  }

  destroy(): void {
    this.stopInterval();
    this.clearRetry();
    for (const handler of this.destroyHandlers) {
      handler();
    }
    this.destroyHandlers = [];
  }

  async forceSync(): Promise<{ pushed: number; pulled: number }> {
    if (!this._online) return { pushed: 0, pulled: 0 };
    return this.doSync();
  }

  private async doSync(): Promise<{ pushed: number; pulled: number }> {
    if (!this._online || this._isSyncing) return { pushed: 0, pulled: 0 };
    this._isSyncing = true;
    this.notify();

    try {
      await this.tryRegister();

      if (!this._online) {
        this._isSyncing = false;
        this.notify();
        return { pushed: 0, pulled: 0 };
      }

      const pushed = await this.push();
      const pulled = await this.pull();

      this._isSyncing = false;
      this.retryAttempts = 0;
      this.notify();
      return { pushed, pulled };
    } catch {
      this._isSyncing = false;
      this.notify();
      this.scheduleRetry();
      return { pushed: 0, pulled: 0 };
    }
  }

  private startInterval(minutes: number) {
    this.stopInterval();
    this.intervalTimer = setInterval(() => {
      if (this._online) this.doSync();
    }, minutes * 60_000);
  }

  private stopInterval() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private scheduleRetry() {
    this.clearRetry();
    const delays = [30_000, 60_000, 120_000, 300_000];
    const delay = delays[Math.min(this.retryAttempts, delays.length - 1)];
    this.retryAttempts++;
    this.retryTimeout = setTimeout(() => {
      if (this._online) this.doSync();
    }, delay);
  }

  private clearRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  configure(config: { autoSyncEnabled?: boolean; interval?: number; relayUrl?: string }) {
    if (config.relayUrl) {
      this.relayUrl = config.relayUrl;
      StoreRepository.set('relayUrl', config.relayUrl);
    }

    if (config.autoSyncEnabled !== undefined) {
      StoreRepository.set('autoSyncEnabled', String(config.autoSyncEnabled));
      if (config.autoSyncEnabled && config.interval) {
        this.startInterval(config.interval);
      } else if (!config.autoSyncEnabled) {
        this.stopInterval();
      }
    }
  }

  private async updatePendingCount() {
    this._pendingPushes = await db.syncQueue.count();
  }

  private async tryRegister(): Promise<void> {
    if (localStorage.getItem('deviceToken')) return;
    try {
      const res = await fetch(`${this.relayUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          deviceName: 'POS Terminal',
          deviceType: 'pos-terminal',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.deviceToken) {
          localStorage.setItem('deviceToken', data.deviceToken);
        }
      }
    } catch {
      /* relay not available */
    }
  }

  private async push(): Promise<number> {
    let total = 0;
    while (true) {
      const queue = await db.syncQueue
        .orderBy('timestamp')
        .limit(50)
        .toArray();

      if (queue.length === 0) break;

      const batch: SyncBatchItem[] = queue.map(item => ({
        table: item.table as SyncBatchItem['table'],
        action: item.action,
        recordId: item.recordId,
        data: item.data,
        deviceId: item.deviceId || getDeviceId(),
        timestamp: item.timestamp,
      }));

      try {
        const res = await fetch(`${this.relayUrl}/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getDeviceToken() ? { Authorization: `Bearer ${getDeviceToken()}` } : {}),
          },
          body: JSON.stringify({ deviceId: getDeviceId(), batch }),
        });

        this._relayConnected = true;

        if (res.ok) {
          const result: SyncPushResponse = await res.json();
          const acceptedIds = new Set<number>();
          for (let i = 0; i < result.accepted; i++) {
            acceptedIds.add(queue[i].id!);
          }

          const now = Date.now();
          const syncedRecords = new Map<string, Set<number>>();

          for (const id of acceptedIds) {
            const item = queue.find(q => q.id === id);
            if (item) {
              const key = item.table;
              if (!syncedRecords.has(key)) syncedRecords.set(key, new Set());
              syncedRecords.get(key)!.add(item.recordId);
            }
            await db.syncQueue.delete(id);
          }

          for (const [table, recordIds] of syncedRecords) {
            try {
              const tbl = (db as any)[table];
              if (tbl && typeof tbl.update === 'function') {
                for (const recordId of recordIds) {
                  try {
                    await tbl.update(recordId, { syncStatus: 'synced', syncedAt: now });
                  } catch { /* record may not exist locally */ }
                }
              }
            } catch { /* best-effort */ }
          }

          total += result.accepted;
          this._lastSyncedAt = result.serverTimestamp;
          this._lastError = null;
        } else {
          throw new Error(`Push failed: ${res.status}`);
        }
      } catch (err) {
        this._relayConnected = false;
        this._lastError = err instanceof Error ? err.message : 'Push failed';
        this._pendingPushes = await db.syncQueue.count();
        this.notify();
        return total;
      }
    }

    this._pendingPushes = await db.syncQueue.count();
    this.notify();
    return total;
  }

  private async pull(): Promise<number> {
    const lastSync = await db.syncMeta.get('products');
    const since = lastSync?.lastSyncedAt ?? 0;

    try {
      const res = await fetch(
        `${this.relayUrl}/pull?since=${since}&deviceId=${getDeviceId()}`,
        {
          headers: {
            ...(getDeviceToken() ? { Authorization: `Bearer ${getDeviceToken()}` } : {}),
          },
        }
      );

      if (!res.ok) {
        if (res.status === 404) return 0;
        throw new Error(`Pull failed: ${res.status}`);
      }

      this._relayConnected = true;
      const data: SyncPullResponse = await res.json();
      const timestamp = data.serverTimestamp;
      let count = 0;

      for (const table of ['products', 'sales', 'users'] as const) {
        const changes = data.changes[table] || [];
        for (const record of changes) {
          const id = record.id as number;
          const existing = await (db[table] as any).get(id);
          const recordUpdatedAt = record.updatedAt as number;
          if (!existing || recordUpdatedAt > existing.updatedAt) {
            await (db[table] as any).put({ ...record, syncedAt: timestamp });
            count++;
          }
        }
        await db.syncMeta.put({
          tableName: table,
          lastSyncedAt: timestamp,
          lastSyncStatus: 'success',
        });
      }

      this._lastSyncedAt = timestamp;
      this._lastError = null;
      this._pendingPushes = await db.syncQueue.count();
      this.notify();
      return count;
    } catch (err) {
      this._lastError = err instanceof Error ? err.message : 'Pull failed';
      this.notify();
      return 0;
    }
  }
}

export const syncService = new SyncService();
