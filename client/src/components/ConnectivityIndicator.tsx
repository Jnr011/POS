import { useState, useEffect, useCallback } from 'react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { WifiOff, RefreshCw, CloudOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerState = 'hidden' | 'offline' | 'syncing' | 'pending' | 'backup_offline';

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

  const bannerState: BannerState =
    !online ? 'offline' :
    isSyncing ? 'syncing' :
    pendingPushes > 0 ? 'pending' :
    'hidden';

  const isVisible = bannerState !== 'hidden';

  return (
    <div className={isVisible ? 'h-7' : 'h-0 overflow-hidden'}>
      {isVisible && (
        <div
          className={cn(
            'fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-4 h-7 text-[11px] font-medium transition-colors duration-300',
            bannerState === 'offline' && 'bg-destructive text-destructive-foreground',
            bannerState === 'syncing' && 'bg-primary/10 text-primary',
            bannerState === 'pending' && 'bg-warning text-warning-foreground',
          )}
        >
          {bannerState === 'offline' && (
            <>
              <CloudOff className="size-3.5 shrink-0" />
              <span className="truncate">
                You're offline — data saved locally. Connect to the internet to sync and backup.
              </span>
            </>
          )}

          {bannerState === 'syncing' && (
            <>
              <RefreshCw className="size-3.5 shrink-0 animate-spin" />
              <span>Syncing data...</span>
            </>
          )}

          {bannerState === 'pending' && (
            <>
              <Wifi className="size-3.5 shrink-0" />
              <span className="truncate">
                {pendingPushes} change{pendingPushes !== 1 ? 's' : ''} pending sync
              </span>
              <button
                onClick={() => forceSync()}
                className="ml-auto shrink-0 underline underline-offset-2 hover:no-underline"
              >
                Sync now
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
