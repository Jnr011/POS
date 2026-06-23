export interface SyncBatchItem {
  table: 'products' | 'sales' | 'users' | 'returns';
  action: 'create' | 'update' | 'delete' | 'upsert';
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
  errors?: { index: number; reason: string }[];
  serverTimestamp: number;
}

export interface SyncPullResponse {
  changes: {
    products?: Record<string, unknown>[];
    sales?: Record<string, unknown>[];
    users?: Record<string, unknown>[];
    returns?: Record<string, unknown>[];
  };
  deletes?: {
    products?: { id: number; updatedAt: number; deviceId: string }[];
    sales?: { id: number; updatedAt: number; deviceId: string }[];
    users?: { id: number; updatedAt: number; deviceId: string }[];
    returns?: { id: number; updatedAt: number; deviceId: string }[];
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
