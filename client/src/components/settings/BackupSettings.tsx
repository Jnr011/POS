import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { StoreRepository } from '../../db/repository';
import { syncService } from '../../services/syncService';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  RefreshCw, Download, Upload, Cloud,
  HardDrive, Clock, Loader2, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function useAutoSync() {
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval_] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    StoreRepository.get('autoSyncEnabled').then(v => setEnabled(v === 'true'));
    StoreRepository.get('autoSyncInterval').then(v => {
      const n = parseInt(v || '5', 10);
      if (!isNaN(n) && n > 0) setInterval_(n);
    });
  }, []);

  const toggle = async (next: boolean) => {
    setEnabled(next);
    await StoreRepository.set('autoSyncEnabled', String(next));
    if (next) startInterval(interval);
    else stopInterval();
  };

  const startInterval = (mins: number) => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) syncService.forceSync();
    }, mins * 60_000);
  };

  const stopInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const changeInterval = async (mins: number) => {
    setInterval_(mins);
    await StoreRepository.set('autoSyncInterval', String(mins));
    if (enabled) startInterval(mins);
  };

  useEffect(() => {
    if (enabled) startInterval(interval);
    return stopInterval;
  }, []);

  return { enabled, interval, toggle, changeInterval };
}

// ─── BackupSettings ──────────────────────────────────────────────────────────

export function BackupSettings() {
  const { relayConnected, pendingPushes, lastSyncedAt, forceSync } = useSyncStatus();
  const { enabled: autoEnabled, interval: autoInterval, toggle, changeInterval } = useAutoSync();
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCounts = async () => {
      const [products, sales, users] = await Promise.all([
        db.products.count(),
        db.sales.count(),
        db.users.count(),
      ]);
      setRecordCounts({ products, sales, users });
    };
    getCounts();
  }, []);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      const result = await forceSync();
      toast.success(`Synced: ${result.pushed} pushed, ${result.pulled} pulled`);
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [products, sales, users, storeInfo] = await Promise.all([
        db.products.toArray(),
        db.sales.toArray(),
        db.users.toArray(),
        db.storeInfo.toArray(),
      ]);

      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { products, sales, users, storeInfo },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.data) throw new Error('Invalid backup file');

      const { products, sales, users, storeInfo } = data.data;
      await db.transaction(
        'rw',
        db.products,
        db.sales,
        db.users,
        db.storeInfo,
        async () => {
          if (products) await db.products.bulkPut(products);
          if (sales) await db.sales.bulkPut(sales);
          if (users) await db.users.bulkPut(users);
          if (storeInfo) await db.storeInfo.bulkPut(storeInfo);
        }
      );

      toast.success(`Imported: ${products?.length || 0} products, ${sales?.length || 0} sales, ${users?.length || 0} users`);
      window.location.reload();
    } catch {
      toast.error('Import failed — invalid backup file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const lastSyncText = lastSyncedAt
    ? format(new Date(lastSyncedAt), 'MMM d, h:mm a')
    : 'Never';

  const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">

      {/* ── Server Sync ── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Cloud className="size-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Server Sync</h2>
              <p className="text-xs text-muted-foreground">Sync your data with the relay server.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-1.5">
                {relayConnected ? (
                  <Wifi className="size-3.5 text-accent" />
                ) : (
                  <WifiOff className="size-3.5 text-muted-foreground/50" />
                )}
                <span className="text-sm font-medium">
                  {relayConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last Sync</p>
              <p className="text-sm font-medium">{lastSyncText}</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
              <p className="text-sm font-medium tabular-nums">{pendingPushes} changes</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Records</p>
              <p className="text-sm font-medium tabular-nums">{totalRecords} total</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <Button onClick={handleForceSync} disabled={syncing} size="sm" className="gap-1.5 w-full">
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* ── Periodic Sync ── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="size-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Periodic Sync</h2>
              <p className="text-xs text-muted-foreground">Automatically sync data at regular intervals.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Auto Sync</p>
              <p className="text-xs text-muted-foreground">Push and pull data periodically when online</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(!autoEnabled)}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                autoEnabled ? 'bg-primary' : 'bg-muted-foreground/30',
              ].join(' ')}
              role="switch"
              aria-checked={autoEnabled}
            >
              <span
                className={[
                  'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                  autoEnabled ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {autoEnabled && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interval (minutes)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={autoInterval}
                onChange={e => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n > 0) changeInterval(n);
                }}
                className="h-10 max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Data will sync every {autoInterval} minute{autoInterval !== 1 ? 's' : ''} when online.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Backup & Restore ── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <HardDrive className="size-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Backup & Restore</h2>
              <p className="text-xs text-muted-foreground">Export or import your local database.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Data summary */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Local Data</p>
            <div className="flex gap-5 text-sm">
              <span className="tabular-nums"><strong>{recordCounts.products ?? 0}</strong> products</span>
              <span className="tabular-nums"><strong>{recordCounts.sales ?? 0}</strong> sales</span>
              <span className="tabular-nums"><strong>{recordCounts.users ?? 0}</strong> users</span>
            </div>
          </div>

          {/* Export / Import buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-1.5 h-10">
              {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {exporting ? 'Exporting...' : 'Export Backup'}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-1.5 h-10">
              {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {importing ? 'Importing...' : 'Import Backup'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <p className="text-[11px] text-muted-foreground text-center">
            Export creates a JSON backup. Import merges data into the current database.
          </p>
        </div>
      </div>
    </div>
  );
}
