import { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';
import type { SyncStatus } from '../types/sync';

export function useSyncStatus(): SyncStatus & { forceSync: () => Promise<{ pushed: number; pulled: number }> } {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    const unsub = syncService.subscribe(setStatus);
    return unsub;
  }, []);

  return {
    ...status,
    forceSync: () => syncService.forceSync(),
  };
}
