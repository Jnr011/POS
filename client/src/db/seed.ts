import { db } from './index';

const RELAY_URL = 'http://localhost:5000/api/sync';

export async function resetDevDatabase(): Promise<void> {
  console.log('[DevReset] Wiping local IndexedDB...');
  await db.transaction(
    'rw',
    db.products,
    db.sales,
    db.users,
    db.syncQueue,
    db.syncMeta,
    db.storeInfo,
    db.stockAdjustments,
    db.activityLog,
    db.printJobs,
    async () => {
      await Promise.all([
        db.products.clear(),
        db.sales.clear(),
        db.users.clear(),
        db.syncQueue.clear(),
        db.syncMeta.clear(),
        db.storeInfo.clear(),
        db.stockAdjustments.clear(),
        db.activityLog.clear(),
        db.printJobs.clear(),
      ]);
    }
  );

  localStorage.removeItem('authUser');
  localStorage.removeItem('deviceId');
  localStorage.removeItem('heldSales');
  localStorage.removeItem('pos-cart');
  localStorage.removeItem('pos_last_email');

  console.log('[DevReset] Wiping relay server...');
  try {
    const res = await fetch(`${RELAY_URL}/reset`, { method: 'POST' });
    if (res.ok) {
      console.log('[DevReset] Server wiped');
    } else {
      console.warn('[DevReset] Server wipe failed:', res.status);
    }
  } catch {
    console.warn('[DevReset] Server not reachable — continuing offline');
  }

  console.log('[DevReset] Done — reloading...');
  window.location.reload();
}
