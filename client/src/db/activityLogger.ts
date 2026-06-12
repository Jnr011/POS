import { db } from '../db';
import type { ActivityLogEntry } from '../types/reports';

type Action = ActivityLogEntry['action'];

let currentUserId = 0;
let currentUserName = 'System';

export const activityLogger = {
  setUser(userId: number, userName: string) {
    currentUserId = userId;
    currentUserName = userName;
  },

  clearUser() {
    currentUserId = 0;
    currentUserName = 'System';
  },

  async log(
    action: Action,
    details: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await db.activityLog.add({
        userId: currentUserId,
        userName: currentUserName,
        action,
        details,
        metadata,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Activity log failed:', err);
    }
  },

  async getLogs(
    from?: Date,
    to?: Date,
    action?: Action,
    limit = 100,
  ): Promise<ActivityLogEntry[]> {
    let query = db.activityLog.orderBy('timestamp').reverse();

    if (from || to) {
      query = query.filter(entry => {
        const ts = entry.timestamp;
        if (from && ts < from.getTime()) return false;
        if (to && ts > to.getTime() + 86400000) return false;
        return true;
      });
    }

    if (action) {
      query = query.filter(entry => entry.action === action);
    }

    return query.limit(limit).toArray();
  },
};
