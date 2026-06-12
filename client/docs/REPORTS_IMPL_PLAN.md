# Reporting Feature — Implementation Plan

> Complete reporting and analytics system for the Pharmacy POS. Covers sales reports, inventory valuation, product performance, and activity logging. Uses shadcn chart, calendar, and tabs components.

---

## Architecture Overview

```
src/
├── types/
│   └── reports.ts                    # NEW — all report-related types
├── db/
│   ├── index.ts                      # MODIFY — add activityLog table (schema v3)
│   ├── repository.ts                 # MODIFY — expand ReportsRepository
│   └── activityLogger.ts             # NEW — centralized activity tracking
├── hooks/
│   ├── useReports.ts                 # REWRITE — proper aggregation
│   └── useActivityLog.ts             # NEW — activity log data
├── components/
│   ├── ui/
│   │   ├── calendar.tsx              # NEW — shadcn calendar
│   │   ├── chart.tsx                 # NEW — shadcn chart
│   │   ├── popover.tsx               # NEW — shadcn popover (calendar dep)
│   │   ├── tabs.tsx                  # NEW — shadcn tabs (report nav)
│   │   └── select.tsx                # EXISTS
│   └── reports/
│       ├── index.ts                  # NEW — barrel exports
│       ├── PeriodSelector.tsx         # NEW — date range picker with presets
│       ├── SalesTrendChart.tsx        # NEW — bar chart for revenue over time
│       ├── MetricCard.tsx             # NEW — stat card for reports
│       ├── TopProductsTable.tsx       # NEW — ranked product table
│       ├── InventoryValuation.tsx     # NEW — stock value breakdown
│       ├── PaymentBreakdown.tsx       # NEW — cash/card/mobile split
│       ├── SalesByAttendant.tsx       # NEW — per-user performance
│       ├── ActivityLog.tsx            # NEW — user action audit trail
│       └── ExportButton.tsx           # NEW — CSV export utility
├── pages/
│   ├── Reports.tsx                    # REWRITE — admin reports dashboard
│   ├── ReportsSales.tsx               # NEW — detailed sales report
│   ├── ReportsProducts.tsx            # NEW — top products report
│   ├── ReportsInventory.tsx           # NEW — inventory valuation report
│   ├── ReportsActivity.tsx            # NEW — activity log page
│   ├── AdminDashboard.tsx             # MODIFY — use formatCurrency
│   └── SalesRepDashboard.tsx          # MODIFY — fix broken data refs
├── App.tsx                            # MODIFY — add report routes
└── lib/
    └── csv-export.ts                  # NEW — CSV generation utility
```

---

## Type Definitions (`types/reports.ts`)

```typescript
export interface SalesTrendPoint {
  date: string;           // "2026-06-01" or "Jun 01"
  revenue: number;
  orders: number;
}

export interface ProductPerformance {
  productId: number;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  percentOfTotal: number;
}

export interface PaymentBreakdown {
  method: 'cash' | 'card' | 'mobile_money';
  count: number;
  total: number;
  percent: number;
}

export interface AttendantPerformance {
  userId: number;
  name: string;
  salesCount: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface InventoryValuation {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  expiringSoonCount: number;
  byCategory: { category: string; value: number; count: number }[];
}

export interface ActivityLogEntry {
  id?: number;
  userId: number;
  userName: string;
  action: 'sale' | 'return' | 'stock_adjust' | 'product_add' | 'product_edit' | 'product_delete' | 'user_add' | 'user_deactivate' | 'csv_import' | 'login' | 'logout';
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueChange: number;    // % vs previous period
  ordersChange: number;     // % vs previous period
}
```

---

## Activity Logger

Centralized service that logs every user action across the app:

| Action | Where triggered | Details |
|--------|----------------|---------|
| `sale` | `SaleRepository.processSale()` | "Sale #42 — 3 items — ₵17.03" |
| `stock_adjust` | `Inventory.tsx` stock save | "Aspirin: 45 → 50 (+5)" |
| `product_add` | `ProductFormDialog.tsx` | "Added Paracetamol 500mg" |
| `product_edit` | `ProductFormDialog.tsx` | "Updated Aspirin price: ₵3.50 → ₵4.00" |
| `product_delete` | `Inventory.tsx` | "Deleted Discontinued Product" |
| `csv_import` | `CsvImportDialog.tsx` | "Imported 15 products from CSV" |
| `user_add` | `AdminDashboard.tsx` | "Created sales rep: John Doe" |
| `user_deactivate` | `AdminDashboard.tsx` | "Deactivated Jane Doe" |
| `login` | `Login.tsx` | "Logged in as admin" |
| `logout` | `Sidebar.tsx` | "Logged out" |

---

## Database Schema Update

Bump to schema v3, add `activityLog` table:

```typescript
this.version(3).stores({
  // ... existing tables ...
  activityLog: '++id, userId, action, timestamp',
});
```

---

## ReportsRepository Methods

| Method | Purpose |
|--------|---------|
| `getSalesByDateRange(from, to)` | Filtered sales for custom range |
| `getReportSummary(from, to)` | Revenue, orders, avg, vs previous period |
| `getSalesTrend(period, count)` | Daily/weekly/monthly aggregated for charts |
| `getProductPerformance(from, to)` | Ranked products by revenue |
| `getPaymentBreakdown(from, to)` | Cash/card/mobile split |
| `getSalesByAttendant(from, to)` | Per-user performance |
| `getInventoryValuation()` | Full inventory breakdown by category |
| `getExpiringProducts(withinDays)` | Products expiring soon |
| `getActivityLog(from, to, action?)` | Filtered activity entries |

---

## Shared Report Components

### PeriodSelector.tsx
- Preset buttons: Today, This Week, This Month, This Year
- Custom range: shadcn Calendar in Popover (from/to)
- Displays selected range as "Jun 1 – Jun 12, 2026"

### MetricCard.tsx
- Extends existing `StatCard` pattern
- Shows: value, label, change percentage (↑/↓ vs previous period)
- Uses `formatCurrency` for monetary values

### SalesTrendChart.tsx
- Recharts `BarChart` via shadcn `ChartContainer`
- X-axis: dates, Y-axis: revenue
- Configurable: daily (last 7 days), weekly (last 4 weeks), monthly (last 12 months)
- Tooltip shows revenue + order count

### TopProductsTable.tsx
- Ranked table: #, Product, Category, Units Sold, Revenue, % of Total
- Visual bar indicator for % share
- Sorted by revenue descending

### PaymentBreakdown.tsx
- Donut/pie or horizontal bar showing cash/card/mobile split
- Shows count + total per method

### SalesByAttendant.tsx
- Table: Attendant, Sales Count, Total Revenue, Avg Order Value
- Admin-only (shows all users)

### InventoryValuation.tsx
- Total value, total products, low stock count, expiring soon count
- Category breakdown table

### ActivityLog.tsx
- Filterable table: Date, User, Action, Details
- Action filter dropdown
- Date range filter (reuses `PeriodSelector`)

### ExportButton.tsx
- Takes table data + column config
- Generates CSV with `formatCurrency` values
- Downloads as `{report-name}-{date-range}.csv`

---

## Pages

### Reports.tsx (Admin Dashboard)
- Route: `/reports`
- Top row: 4 MetricCards (Revenue, Orders, Avg Value, Low Stock)
- Sales trend chart (last 30 days)
- Top 5 products (compact)
- Payment method breakdown
- Quick links to sub-reports

### ReportsSales.tsx
- Route: `/reports/sales`
- PeriodSelector at top
- SalesTrendChart for selected period
- Sales by attendant table
- Daily breakdown table

### ReportsProducts.tsx
- Route: `/reports/products`
- PeriodSelector
- TopProductsTable with full ranking
- Category performance breakdown

### ReportsInventory.tsx
- Route: `/reports/inventory`
- InventoryValuation component
- Low stock alerts list
- Expiring soon list

### ReportsActivity.tsx
- Route: `/reports/activity`
- ActivityLog component
- Filterable by user, action type, date range

---

## Route & Navigation Updates

### App.tsx
```tsx
<Route path="/reports" element={<Reports />} />
<Route path="/reports/sales" element={<ReportsSales />} />
<Route path="/reports/products" element={<ReportsProducts />} />
<Route path="/reports/inventory" element={<ReportsInventory />} />
<Route path="/reports/activity" element={<ReportsActivity />} />
```

### Sidebar.tsx
```tsx
const ADMIN_NAV = [
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Sales Report', path: '/reports/sales', icon: TrendingUp },
  { label: 'Top Products', path: '/reports/products', icon: Award },
  { label: 'Inventory Valuation', path: '/reports/inventory', icon: DollarSign },
  { label: 'Activity Log', path: '/reports/activity', icon: Clock },
];
```

---

## Activity Logger Integration Points

| File | Action |
|------|--------|
| `repository.ts` → `processSale()` | Log `sale` |
| `Inventory.tsx` → stock save | Log `stock_adjust` |
| `ProductFormDialog.tsx` → save | Log `product_add` or `product_edit` |
| `CsvImportDialog.tsx` → import | Log `csv_import` |
| `AdminDashboard.tsx` → create rep | Log `user_add` |
| `AdminDashboard.tsx` → deactivate | Log `user_deactivate` |
| `Login.tsx` → success | Log `login` |
| `Sidebar.tsx` → logout | Log `logout` |

---

## Chart Theme Tokens

Add to `index.css`:
```css
:root {
  --chart-1: oklch(0.55 0.16 220);  /* primary — revenue */
  --chart-2: oklch(0.72 0.18 160);  /* accent — orders */
  --chart-3: oklch(0.75 0.18 85);   /* warning — low stock */
  --chart-4: oklch(0.58 0.22 25);   /* destructive — expiring */
}
```

---

## Existing Page Fixes

### AdminDashboard.tsx
- Replace all `GHS` hardcoded strings with `formatCurrency()`
- Wire "View Reports" link to `/reports`

### SalesRepDashboard.tsx
- Fix broken `sale.product_id` references → use `sale.items`
- Replace `GHS` with `formatCurrency()`
- Show personal stats only (filtered by `user.id`)

---

## Implementation Order

| Step | What | Depends on |
|------|------|------------|
| 1 | Install deps | — |
| 2 | Types | — |
| 3 | DB schema v3 + activityLog | — |
| 4 | Activity logger service | Step 3 |
| 5 | Expand ReportsRepository | Step 2 |
| 6 | UI components (calendar, chart, popover, tabs) | Step 1 |
| 7 | Shared report components | Steps 2, 5, 6 |
| 8 | Report pages | Step 7 |
| 9 | Routes + sidebar | Step 8 |
| 10 | Integrate activity logger | Steps 4, 5 |
| 11 | Fix existing dashboards | Step 2 |
| 12 | Chart theme tokens | Step 6 |

---

## Estimated File Count

- **New files**: ~18
- **Modified files**: ~8
- **Total**: ~26 files
