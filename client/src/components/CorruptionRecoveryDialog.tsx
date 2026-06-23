import { useState, useEffect } from 'react';
import { db } from '../db';
import { autoBackupService } from '../services/autoBackupService';
import { AlertTriangle, Database, RotateCcw, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onRecovered?: () => void;
}

interface BackupEntry {
  id: number;
  label: string;
  date: Date;
  size: number;
}

export function CorruptionRecoveryDialog({ open, onClose, onRecovered }: Props) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!open) return;
    autoBackupService.getBackups().then(list => {
      setBackups(
        list.map(b => ({
          id: b.id!,
          label: b.label,
          date: new Date(b.createdAt),
          size: new Blob([b.data]).size,
        }))
      );
    });
  }, [open]);

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      await autoBackupService.restore(id);
      toast.success('Database restored from backup');
      onRecovered?.();
      onClose();
      window.location.reload();
    } catch {
      toast.error('Restore failed');
    } finally {
      setRestoringId(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      // Clear all data tables but keep storeInfo and settings
      await db.transaction('rw', [db.products, db.sales, db.users, db.returns, db.stockAdjustments, db.activityLog, db.syncQueue], async () => {
        await db.products.clear();
        await db.sales.clear();
        await db.users.clear();
        await db.returns.clear();
        await db.stockAdjustments.clear();
        await db.activityLog.clear();
        await db.syncQueue.clear();
      });
      toast.success('Database reset. You can import a backup or start fresh.');
      onRecovered?.();
      onClose();
      window.location.reload();
    } catch {
      toast.error('Reset failed. Try reloading the page.');
    } finally {
      setResetting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-xl border bg-card shadow-2xl">
        <div className="px-6 py-5 border-b border-border space-y-1">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Database corruption detected
            </h2>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            We found issues reading your local database. You can restore from a previous backup or reset to start fresh.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Available backups */}
          {backups.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Available backups
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {backups.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Database className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(b.date, 'MMM d, yyyy h:mm a')} &middot; {(b.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(b.id)}
                      disabled={restoringId === b.id}
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
          ) : (
            <div className="rounded-lg border border-border p-6 text-center space-y-2">
              <Database className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No local backups found. You can reset the database or import a backup file.
              </p>
            </div>
          )}

          {/* Fallback actions */}
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <Trash2 className="size-4 shrink-0 text-destructive" />
            <p className="text-sm text-muted-foreground flex-1">
              Reset will erase all data (products, sales, users). Settings are preserved.
            </p>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
              className="gap-1.5 shrink-0"
            >
              {resetting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Reset DB
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
