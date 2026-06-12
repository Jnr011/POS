import { useEffect } from 'react';
import { syncService } from '../services/syncService';
import { toast } from 'sonner';

export function useSync() {
  useEffect(() => {
    syncService.initialize();

    const unsub = syncService.subscribe((status) => {
      if (status.lastErrorMessage) {
        toast.error(`Sync error: ${status.lastErrorMessage}`);
      }
    });

    return () => {
      unsub();
      syncService.destroy();
    };
  }, []);
}
