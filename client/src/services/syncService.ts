import { db } from '../db';
import type { SyncBatchItem, SyncPushResponse, SyncPullResponse, SyncStatus } from '../types/sync';

const RELAY_URL = 'http://localhost:5000/api/sync';

function getDeviceId(): string {
  return localStorage.getItem('deviceId') || 'pos-unknown';
}

function getDeviceToken(): string | null {
  return localStorage.getItem('deviceToken');
}

type StatusListener = (status: SyncStatus) => void;

class SyncService {
  private pushInterval: ReturnType<typeof setInterval> | null = null;
  private pullInterval: ReturnType<typeof setInterval> | null = null;
  private _isSyncing = false;
  private _pendingPushes = 0;
  private _lastSyncedAt: number | null = null;
  private _lastError: string | null = null;
  private _relayConnected = false;
  private listeners: Set<StatusListener> = new Set();

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
    await this.tryRegister();
    this.pushInterval = setInterval(() => this.push(), 60_000);
    this.pullInterval = setInterval(() => this.pull(), 120_000);
    if (navigator.onLine) {
      this.push();
      this.pull();
    }
    window.addEventListener('online', () => {
      this.push();
      this.pull();
    });
  }

  destroy(): void {
    if (this.pushInterval) clearInterval(this.pushInterval);
    if (this.pullInterval) clearInterval(this.pullInterval);
  }

  async forceSync(): Promise<{ pushed: number; pulled: number }> {
    const pushResult = await this.push();
    const pullResult = await this.pull();
    return { pushed: pushResult, pulled: pullResult };
  }

  private async tryRegister(): Promise<void> {
    if (localStorage.getItem('deviceToken')) return;
    try {
      const res = await fetch(`${RELAY_URL}/register`, {
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
      // Relay not available — continue offline
    }
  }

  private async push(): Promise<number> {
    if (this._isSyncing) return 0;
    if (!navigator.onLine) {
      this._relayConnected = false;
      this.notify();
      return 0;
    }

    const queue = await db.syncQueue
      .orderBy('timestamp')
      .limit(50)
      .toArray();

    if (queue.length === 0) return 0;

    this._isSyncing = true;
    this.notify();

    const batch: SyncBatchItem[] = queue.map(item => ({
      table: item.table as SyncBatchItem['table'],
      action: item.action,
      recordId: item.recordId,
      data: item.data,
      deviceId: item.deviceId || getDeviceId(),
      timestamp: item.timestamp,
    }));

    try {
      const res = await fetch(`${RELAY_URL}/push`, {
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
        for (const id of acceptedIds) {
          await db.syncQueue.delete(id);
        }
        this._lastSyncedAt = result.serverTimestamp;
        this._lastError = null;
        this._pendingPushes = (await db.syncQueue.count());
        this._isSyncing = false;
        this.notify();
        return result.accepted;
      } else {
        throw new Error(`Push failed: ${res.status}`);
      }
    } catch (err) {
      this._relayConnected = false;
      this._lastError = err instanceof Error ? err.message : 'Push failed';
      this._isSyncing = false;
      this._pendingPushes = (await db.syncQueue.count());
      this.notify();
      return 0;
    }
  }

  private async pull(): Promise<number> {
    if (this._isSyncing) return 0;
    if (!navigator.onLine) return 0;

    const lastSync = await db.syncMeta.get('products');
    const since = lastSync?.lastSyncedAt ?? 0;

    try {
      const res = await fetch(
        `${RELAY_URL}/pull?since=${since}&deviceId=${getDeviceId()}`,
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
