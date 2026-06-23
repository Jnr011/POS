import { useSyncStatus } from '../hooks/useSyncStatus';
import { RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SyncBadge() {
  const { relayConnected, pendingPushes, isSyncing, forceSync } = useSyncStatus();

  return (
    <div className="rounded-lg bg-primary-foreground/8 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'size-2 shrink-0 rounded-full transition-colors duration-300',
              relayConnected ? 'bg-accent' : 'bg-primary-foreground/30',
            )}
          />
          <span className="text-[12px] text-primary-foreground/70 font-medium truncate">
            {relayConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <button
          onClick={forceSync}
          disabled={isSyncing}
          className="flex size-5 items-center justify-center rounded text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors disabled:opacity-50"
          title="Sync now"
        >
          {isSyncing ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
        </button>
      </div>
      {pendingPushes > 0 && (
        <p className="text-[10px] text-primary-foreground/50 leading-tight">
          {pendingPushes} change{pendingPushes !== 1 ? 's' : ''} pending
        </p>
      )}
    </div>
  );
}
