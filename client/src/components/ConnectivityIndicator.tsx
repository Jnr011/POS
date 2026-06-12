import { useState, useEffect } from 'react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { WifiOff, RefreshCw } from 'lucide-react';

export function ConnectivityIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const { pendingPushes, isSyncing, forceSync } = useSyncStatus();

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online && pendingPushes === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium animate-fade-in ${
        online
          ? 'bg-warning text-warning-foreground'
          : 'bg-destructive text-destructive-foreground'
      }`}
    >
      {!online ? (
        <>
          <WifiOff className="size-4" />
          <span>You are offline — changes will sync when connection is restored</span>
        </>
      ) : (
        <>
          <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing
              ? 'Syncing...'
              : `${pendingPushes} change${pendingPushes !== 1 ? 's' : ''} pending sync`}
          </span>
          {!isSyncing && pendingPushes > 0 && (
            <button
              onClick={() => forceSync()}
              className="underline underline-offset-2 hover:no-underline text-xs ml-1"
            >
              Sync now
            </button>
          )}
        </>
      )}
    </div>
  );
}
