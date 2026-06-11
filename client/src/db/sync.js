import { db } from './index';
import API from '../services/api';

export async function syncPendingChanges() {
  if (!navigator.onLine) return { synced: 0, errors: 0 };

  const queue = await db.syncQueue.orderBy('timestamp').toArray();
  let synced = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'create':
          await API.post(`/${item.table}`, item.data);
          break;
        case 'update':
          await API.put(`/${item.table}/${item.recordId}`, item.data);
          break;
        case 'delete':
          await API.delete(`/${item.table}/${item.recordId}`);
          break;
      }
      await db.syncQueue.delete(item.id);
      synced++;
    } catch (err) {
      console.error(`Sync failed for ${item.table} #${item.recordId}:`, err);
      errors++;
    }
  }

  return { synced, errors };
}
