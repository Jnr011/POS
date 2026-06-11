import { useEffect, useRef } from 'react';
import { syncPendingChanges } from '../db/sync';
import { useToast } from '../components/Toast';

export function useSync(intervalMs: number = 30000) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;
      const result = await syncPendingChanges();
      if (result.synced > 0) {
        addToast(`Synced ${result.synced} pending changes`, 'success');
      }
    };

    sync();
    intervalRef.current = setInterval(sync, intervalMs);

    const handleOnline = () => { sync(); };
    window.addEventListener('online', handleOnline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
    };
  }, [intervalMs]);
}
