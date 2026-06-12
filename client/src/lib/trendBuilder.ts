import type { TrendPreset, SalesTrendPoint } from '../types/reports';

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

interface BucketDef {
  key: string;
  label: string;
  from: Date;
  to: Date;
}

export function generateBuckets(preset: TrendPreset, refDate?: Date): BucketDef[] {
  const now = refDate || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const buckets: BucketDef[] = [];
      for (let h = 0; h < 24; h += 2) {
        const from = new Date(today);
        from.setHours(h, 0, 0, 0);
        const to = new Date(today);
        to.setHours(h + 2, 0, 0, 0);
        buckets.push({
          key: `h${h}`,
          label: formatHour(h),
          from,
          to,
        });
      }
      return buckets;
    }

    case 'yesterday': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const buckets: BucketDef[] = [];
      for (let h = 0; h < 24; h += 2) {
        const from = new Date(d);
        from.setHours(h, 0, 0, 0);
        const to = new Date(d);
        to.setHours(h + 2, 0, 0, 0);
        buckets.push({
          key: `h${h}`,
          label: formatHour(h),
          from,
          to,
        });
      }
      return buckets;
    }

    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const buckets: BucketDef[] = [];
      for (let i = 0; i < 7; i++) {
        const from = new Date(monday);
        from.setDate(monday.getDate() + i);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setHours(23, 59, 59, 999);
        buckets.push({
          key: from.toISOString().split('T')[0],
          label: dayNames[i],
          from,
          to,
        });
      }
      return buckets;
    }

    case 'last_7_days': {
      const dayOfWeek = today.getDay();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 13 : dayOfWeek + 6));
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const buckets: BucketDef[] = [];
      for (let i = 0; i < 7; i++) {
        const from = new Date(lastMonday);
        from.setDate(lastMonday.getDate() + i);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setHours(23, 59, 59, 999);
        buckets.push({
          key: from.toISOString().split('T')[0],
          label: dayNames[i],
          from,
          to,
        });
      }
      return buckets;
    }

    case 'this_month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const buckets: BucketDef[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const from = new Date(year, month, day, 0, 0, 0, 0);
        const to = new Date(year, month, day, 23, 59, 59, 999);
        buckets.push({
          key: from.toISOString().split('T')[0],
          label: `${day}${getDaySuffix(day)}`,
          from,
          to,
        });
      }
      return buckets;
    }

    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lm.getFullYear();
      const month = lm.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const buckets: BucketDef[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const from = new Date(year, month, day, 0, 0, 0, 0);
        const to = new Date(year, month, day, 23, 59, 59, 999);
        buckets.push({
          key: from.toISOString().split('T')[0],
          label: `${day}${getDaySuffix(day)}`,
          from,
          to,
        });
      }
      return buckets;
    }

    case 'this_year': {
      const year = now.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets: BucketDef[] = [];
      for (let m = 0; m < 12; m++) {
        const from = new Date(year, m, 1, 0, 0, 0, 0);
        const to = new Date(year, m + 1, 0, 23, 59, 59, 999);
        buckets.push({
          key: `${year}-${String(m + 1).padStart(2, '0')}`,
          label: monthNames[m],
          from,
          to,
        });
      }
      return buckets;
    }

    default:
      return [];
  }
}

interface RawSale {
  date: string;
  grand_total: number;
}

export function buildTrendData(
  preset: TrendPreset,
  sales: RawSale[],
): SalesTrendPoint[] {
  const buckets = generateBuckets(preset);

  const grouped = new Map<string, { revenue: number; orders: number }>();

  for (const sale of sales) {
    const saleTime = new Date(sale.date).getTime();
    for (const bucket of buckets) {
      if (saleTime >= bucket.from.getTime() && saleTime <= bucket.to.getTime()) {
        const existing = grouped.get(bucket.key) || { revenue: 0, orders: 0 };
        existing.revenue += sale.grand_total;
        existing.orders += 1;
        grouped.set(bucket.key, existing);
        break;
      }
    }
  }

  return buckets.map(bucket => {
    const data = grouped.get(bucket.key) || { revenue: 0, orders: 0 };
    return {
      date: bucket.label,
      revenue: data.revenue,
      orders: data.orders,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    };
  });
}
