import { useState, useEffect, useRef } from 'react';
import { db, type DbBackupRecord } from '../../db';
import { StoreRepository } from '../../db/repository';
import { syncService } from '../../services/syncService';
import { autoBackupService } from '../../services/autoBackupService';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  RefreshCw, Download, Upload, Cloud,
  HardDrive, Clock, Loader2, Wifi, WifiOff,
  Camera, RotateCcw, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function useAutoSync() {
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval_] = useState(5);

  useEffect(() => {
    StoreRepository.get('autoSyncEnabled').then(v => setEnabled(v === 'true'));
    StoreRepository.get('autoSyncInterval').then(v => {
      const n = parseInt(v || '5', 10);
      if (!isNaN(n) && n > 0) setInterval_(n);
    });
  }, []);

  const toggle = async (next: boolean) => {
    setEnabled(next);
    syncService.configure({ autoSyncEnabled: next, interval });
  };

  const changeInterval = async (mins: number) => {
    setInterval_(mins);
    await StoreRepository.set('autoSyncInterval', String(mins));
    if (enabled) syncService.configure({ autoSyncEnabled: true, interval: mins });
  };

  return { enabled, interval, toggle, changeInterval };
}

function useAutoBackup() {
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval_] = useState(60);
  const [retention, setRetention] = useState(5);
  const [lastBackup, setLastBackup] = useState<number | null>(null);

  useEffect(() => {
    StoreRepository.get('autoBackupEnabled').then(v => setEnabled(v === 'true'));
    autoBackupService.getInterval().then(setInterval_);
    autoBackupService.getRetention().then(v => {
      const stored = localStorage.getItem('autoBackupRetention');
      setRetention(stored ? parseInt(stored, 10) : 5);
    });
    setLastBackup(autoBackupService.lastBackupAt);
  }, []);

  const toggle = async (next: boolean) => {
    setEnabled(next);
    await StoreRepository.set('autoBackupEnabled', String(next));
    if (next) {
      await autoBackupService.start();
      await autoBackupService.takeSnapshot('First auto-backup');
      setLastBackup(autoBackupService.lastBackupAt);
    } else {
      autoBackupService.stop();
    }
  };

  const changeInterval = async (mins: number) => {
    setInterval_(mins);
    await autoBackupService.setInterval(mins);
    if (enabled) {
      autoBackupService.stop();
      await autoBackupService.start();
    }
  };

  const changeRetention = async (n: number) => {
    setRetention(n);
    await autoBackupService.setRetention(n);
  };

  return { enabled, interval, retention, lastBackup, toggle, changeInterval, changeRetention };
}

export function BackupSettings() {
  const { relayConnected, pendingPushes, lastSyncedAt, forceSync } = useSyncStatus();
  const { enabled: autoEnabled, interval: autoInterval, toggle, changeInterval } = useAutoSync();
  const ab = useAutoBackup();
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snapshoting, setSnapshoting] = useState(false);
  const [backups, setBackups] = useState<DbBackupRecord[]>([]);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [integrity, setIntegrity] = useState<{ healthy: boolean; lastChecked: number | null }>({ healthy: true, lastChecked: null });
  const [checking, setChecking] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCounts = async () => {
      const [products, sales, users, returns, stockAdj, queue] = await Promise.all([
        db.products.count(),
        db.sales.count(),
        db.users.count(),
        db.returns.count(),
        db.stockAdjustments.count(),
        db.syncQueue.count(),
      ]);
      setRecordCounts({ products, sales, users, returns, stockAdjustments: stockAdj, syncQueue: queue });
    };
    getCounts();
  }, []);

  useEffect(() => {
    autoBackupService.getBackups().then(setBackups);
  }, [ab.lastBackup]);

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
      const [products, sales, users, storeInfo, returns, stockAdjustments] = await Promise.all([
        db.products.toArray(),
        db.sales.toArray(),
        db.users.toArray(),
        db.storeInfo.toArray(),
        db.returns.toArray(),
        db.stockAdjustments.toArray(),
      ]);

      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: { products, sales, users, storeInfo, returns, stockAdjustments },
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

      const { products, sales, users, storeInfo, returns, stockAdjustments } = data.data;
      await db.transaction(
        'rw',
        [db.products, db.sales, db.users, db.storeInfo, db.returns, db.stockAdjustments],
        async () => {
          if (products) await db.products.bulkPut(products);
          if (sales) await db.sales.bulkPut(sales);
          if (users) await db.users.bulkPut(users);
          if (storeInfo) await db.storeInfo.bulkPut(storeInfo);
          if (returns) await db.returns.bulkPut(returns);
          if (stockAdjustments) await db.stockAdjustments.bulkPut(stockAdjustments);
        }
      );

      toast.success(
        `Imported: ${products?.length || 0} products, ${sales?.length || 0} sales, ` +
        `${users?.length || 0} users, ${returns?.length || 0} returns`
      );
      window.location.reload();
    } catch {
      toast.error('Import failed — invalid backup file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSnapshot = async () => {
    setSnapshoting(true);
    try {
      const id = await autoBackupService.takeSnapshot('Manual snapshot');
      const list = await autoBackupService.getBackups();
      setBackups(list);
      toast.success(`Backup saved (ID ${id})`);
    } catch {
      toast.error('Snapshot failed');
    } finally {
      setSnapshoting(false);
    }
  };

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      await autoBackupService.restore(id);
      toast.success('Database restored from backup');
      window.location.reload();
    } catch {
      toast.error('Restore failed');
    } finally {
      setRestoringId(null);
    }
  };

  const handleCheckIntegrity = async () => {
    setChecking(true);
    try {
      const result = await autoBackupService.checkIntegrity();
      setIntegrity({ healthy: result.healthy, lastChecked: Date.now() });
      if (result.healthy) {
        toast.success('Database integrity check passed');
      } else {
        const failed = Object.entries(result.tableStatuses)
          .filter(([, s]) => !s.ok)
          .map(([name]) => name);
        toast.error(`Integrity issues in: ${failed.join(', ')}`);
      }
    } catch {
      toast.error('Integrity check failed');
    } finally {
      setChecking(false);
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

      {/* ── Auto Backup ── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Camera className="size-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Auto Backup</h2>
              <p className="text-xs text-muted-foreground">Periodic snapshots stored in the local database for corruption recovery.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Scheduled Backups</p>
              <p className="text-xs text-muted-foreground">
                {ab.enabled
                  ? `Every ${ab.interval} min, keeping last ${ab.retention} snapshots`
                  : 'Take automatic snapshots of your database'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ab.toggle(!ab.enabled)}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                ab.enabled ? 'bg-primary' : 'bg-muted-foreground/30',
              ].join(' ')}
              role="switch"
              aria-checked={ab.enabled}
            >
              <span
                className={[
                  'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                  ab.enabled ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {ab.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Interval (minutes)</label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={ab.interval}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 5) ab.changeInterval(n);
                  }}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Retention (snapshots)</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={ab.retention}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 1) ab.changeRetention(n);
                  }}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Last backup */}
          {ab.lastBackup && (
            <p className="text-xs text-muted-foreground">
              Last snapshot: {format(new Date(ab.lastBackup), 'MMM d, h:mm a')}
            </p>
          )}

          <Button
            variant="outline"
            onClick={handleSnapshot}
            disabled={snapshoting}
            className="gap-1.5 w-full"
          >
            {snapshoting ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {snapshoting ? 'Taking snapshot...' : 'Take Snapshot Now'}
          </Button>

          {/* Integrity check */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              {integrity.lastChecked ? (
                integrity.healthy ? (
                  <CheckCircle2 className="size-4 text-accent" />
                ) : (
                  <AlertTriangle className="size-4 text-destructive" />
                )
              ) : (
                <div className="size-4 rounded-full bg-muted-foreground/20" />
              )}
              <div>
                <p className="text-sm font-medium">Database Integrity</p>
                <p className="text-xs text-muted-foreground">
                  {integrity.lastChecked
                    ? integrity.healthy
                      ? 'All tables healthy'
                      : 'Issues detected — see corruption dialog'
                    : 'Not checked yet'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCheckIntegrity}
              disabled={checking}
              className="gap-1.5"
            >
              {checking ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Check
            </Button>
          </div>

          {/* Backups list */}
          {backups.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Saved snapshots ({backups.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.createdAt), 'MMM d, yyyy h:mm a')} &middot;
                        {' '}{(new Blob([b.data]).size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => b.id && handleRestore(b.id)}
                      disabled={restoringId === b.id || !b.id}
                      className="gap-1.5 shrink-0"
                    >
                      {restoringId === b.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
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
              <h2 className="text-sm font-semibold text-foreground">Export & Import</h2>
              <p className="text-xs text-muted-foreground">Download or upload a full database backup file.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Local Data</p>
            <div className="grid grid-cols-3 gap-x-5 gap-y-1 text-sm">
              <span className="tabular-nums"><strong>{recordCounts.products ?? 0}</strong> products</span>
              <span className="tabular-nums"><strong>{recordCounts.sales ?? 0}</strong> sales</span>
              <span className="tabular-nums"><strong>{recordCounts.users ?? 0}</strong> users</span>
              <span className="tabular-nums"><strong>{recordCounts.returns ?? 0}</strong> returns</span>
              <span className="tabular-nums"><strong>{recordCounts.stockAdjustments ?? 0}</strong> stock adj.</span>
              <span className="tabular-nums"><strong>{recordCounts.syncQueue ?? 0}</strong> queue</span>
            </div>
          </div>

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
            Export creates a JSON file. Import merges data into the current database.
          </p>
        </div>
      </div>
    </div>
  );
}
