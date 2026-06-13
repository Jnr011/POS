import { useEffect, useRef } from 'react';
import { syncService } from '../services/syncService';

export function useSync() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const timer = setTimeout(() => {
      syncService.initialize();
    }, 2000);

    return () => {
      clearTimeout(timer);
      syncService.destroy();
    };
  }, []);
}
