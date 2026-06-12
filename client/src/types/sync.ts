export interface SyncBatchItem {
  table: 'products' | 'sales' | 'users';
  action: 'create' | 'update' | 'delete';
  recordId: number;
  data: Record<string, unknown> | null;
  deviceId: string;
  timestamp: number;
}

export interface SyncPushRequest {
  deviceId: string;
  batch: SyncBatchItem[];
}

export interface SyncPushResponse {
  accepted: number;
  rejected: number;
  errors: { index: number; reason: string }[];
  serverTimestamp: number;
}

export interface SyncPullResponse {
  changes: {
    products?: Record<string, unknown>[];
    sales?: Record<string, unknown>[];
    users?: Record<string, unknown>[];
    storeInfo?: Record<string, unknown>;
  };
  serverTimestamp: number;
}

export interface SyncStatus {
  pendingPushes: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  lastErrorMessage: string | null;
  relayConnected: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'pos-terminal';
}
