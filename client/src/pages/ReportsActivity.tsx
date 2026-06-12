import { useState, useEffect } from 'react';
import { activityLogger } from '../db/activityLogger';
import { PageHeader } from '../components/PageHeader';
import { ActivityLog } from '../components/reports/ActivityLog';
import { Skeleton } from '../components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import type { ActivityLogEntry } from '../types/reports';

function ReportsActivity() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const l = await activityLogger.getLogs(undefined, undefined, undefined, 200);
        if (!cancelled) setLogs(l);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<ClipboardList className="size-4 text-primary" />}
        title="Activity Log"
        description="User actions and system events audit trail"
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <ActivityLog data={logs} />
      )}
    </div>
  );
}

export default ReportsActivity;
