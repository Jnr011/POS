# Offline-First Architecture

> The POS application runs fully offline. All data lives in IndexedDB. The Express server acts as a local sync relay to the cloud.

---

## 1. Architectural Flow

```
┌──────────────────────────────────────────────────────────┐
│                    POS TERMINAL (React)                   │
│                                                           │
│  User Action                                               │
│       │                                                    │
│       ▼                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │         IndexedDB (Dexie)             │                  │
│  │  ┌──────────┐ ┌────────┐ ┌────────┐  │                  │
│  │  │ Products │ │ Sales  │ │ Users  │  │  ← Primary store │
│  │  ├──────────┤ ├────────┤ ├────────┤  │                  │
│  │  │ syncQueue│ │syncMeta│ │storeInfo│  │  ← Sync metadata │
│  │  └──────────┘ └────────┘ └────────┘  │                  │
│  └────────────────┬─────────────────────┘                  │
│                   │                                        │
│                   ▼                                        │
│  ┌──────────────────────────────┐                          │
│  │        Sync Engine            │                          │
│  │  • Push local changes         │                          │
│  │  • Pull cloud updates         │                          │
│  │  • Conflict resolution        │                          │
│  │  • Periodic (every 60s)       │                          │
│  └──────────────┬───────────────┘                          │
└─────────────────┼──────────────────────────────────────────┘
                  │  HTTP (local network)
                  ▼
┌──────────────────────────────────────────────────────────┐
│              EXPRESS SYNC RELAY (Local)                   │
│                                                           │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  POST /sync/:table   │  │  GET /sync/changes        │   │
│  │  Receive pushes from │  │  Serve pending changes    │   │
│  │  POS terminals       │  │  to POS terminals         │   │
│  └──────────┬───────────┘  └───────────┬──────────────┘   │
│             │                          │                   │
│             ▼                          ▼                   │
│  ┌──────────────────────────────────────────┐              │
│  │            SQLite Database                │              │
│  │  Local cache of all POS data              │              │
│  │  Syncs with cloud periodically            │              │
│  └──────────────────┬───────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌──────────────────────────────────────────┐              │
│  │            Cloud Sync Engine              │              │
│  │  • Push local SQLite → Cloud DB           │              │
│  │  • Pull Cloud DB → local SQLite           │              │
│  │  • Periodic (every 5 min)                 │              │
│  │  • Retry with backoff                     │              │
│  └──────────────────────────────────────────┘              │
└──────────────────────┬─────────────────────────────────────┘
                       │  HTTPS (internet)
                       ▼
              ┌──────────────────┐
              │    Cloud DB       │
              │  (Central backup) │
              │  Multi-pharmacy   │
              │  or single-store  │
              └──────────────────┘
```

---

## 2. Data Flow Rules

| Rule | Description |
|------|-------------|
| **POS never waits** | Every user action reads/writes IndexedDB instantly. Zero network dependency. |
| **Express is a relay** | It receives sync pushes, stores in SQLite, acknowledges immediately. Does not validate, transform, or enrich. |
| **Cloud is async** | Express syncs to cloud every 5 minutes. Cloud DB is a backup/aggregation layer, not operational. |
| **Multi-device sync** | Two POS terminals in the same pharmacy sync through Express. Device A pushes → Express stores → Device B pulls. |
| **Conflict wins** | Last-write-wins by `updatedAt` timestamp. All records carry `updatedAt` and `deviceId`. |

---

## 3. The Sync Handshake

```
POS → Express:    POST /api/sync/push
──────────────────────────────────────
Request:
{
  "deviceId": "pos-terminal-01",
  "batch": [
    { "table": "products", "action": "update", "recordId": 42,
      "data": { "price": 6.99, "updatedAt": 1718112345000 },
      "deviceId": "pos-terminal-01",
      "timestamp": 1718112345000
    },
    { "table": "sales", "action": "create", "recordId": 203,
      "data": { "product_id": 42, "quantity": 2, ... },
      "deviceId": "pos-terminal-01",
      "timestamp": 1718112346000
    }
  ]
}

Response:
{
  "accepted": 2,
  "rejected": 0,
  "serverTimestamp": 1718112347000
}

POS → Express:    GET /api/sync/pull?since=1718112347000&deviceId=pos-terminal-01
──────────────────────────────────────
Response:
{
  "changes": {
    "products": [
      { "id": 15, "name": "Aspirin", "price": 4.50, "updatedAt": 1718112300000, "deviceId": "pos-terminal-02" }
    ],
    "sales": [],
    "users": [],
    "storeInfo": []
  },
  "serverTimestamp": 1718112350000
}
```

---

## 4. File Changes Summary

### Files to Delete

| File | Why |
|------|-----|
| `client/src/services/api.ts` | No longer the data path. Sync engine has its own HTTP client. |

### Files to Create (client)

| File | Purpose |
|------|---------|
| `client/src/services/syncService.ts` | Background sync engine — push/pull cycles, retry backoff, conflict resolution |
| `client/src/services/printerService.ts` | WebUSB printer — connect, ESC/POS receipt builder, disconnect |
| `client/src/services/printerService.ts` | (alias for above — printer handling) |
| `client/src/db/seed.ts` | First-launch seeder — demo products, admin user, store info |
| `client/src/hooks/usePrinter.ts` | React hook — printer state, connect/disconnect/print actions |
| `client/src/hooks/useSyncStatus.ts` | React hook — pending pushes, last sync time, isSyncing, forceSync |
| `client/src/components/SyncStatusBar.tsx` | UI — small banner showing sync status and pending count |
| `client/src/types/sync.ts` | Types — SyncQueueItem, SyncMeta, SyncResult, SyncEvent |
| `client/src/types/printer.ts` | Types — PrinterState, PrintJob, ReceiptLine |

### Files to Rewrite (client)

| File | What Changes |
|------|-------------|
| `client/src/db/index.ts` | Schema v2 — add `syncMeta`, `printJobs`, `storeInfo`, `stockAdjustments` tables. Add `updatedAt`/`syncedAt`/`syncStatus` fields. |
| `client/src/db/repository.ts` | **Complete rewrite** — remove all `navigator.onLine` branches. Always read/write local. Add `processSale()` (transactional), `adjustStock()`, Dexie-based search/filter. |
| `client/src/db/sync.ts` | **Complete rewrite** — replace simple queue with two-way sync engine pushing to Express relay. |
| `client/src/hooks/useAuth.ts` | Remove API calls. Validate PIN against `db.users` using Web Crypto SHA-256. |
| `client/src/hooks/useReports.ts` | Remove all API calls. Compute from `db.sales` + `db.products` via Dexie aggregations. |
| `client/src/hooks/useSync.ts` | Use new SyncService. Track status. Show pending count. |

### Files to Modify (client)

| File | Changes |
|------|---------|
| `client/src/store/authStore.ts` | Add `deviceId`, PIN-based auth. Remove JWT token logic. Add sync status fields. |
| `client/src/store/cartStore.ts` | Add `paymentMethod`, `amountTendered`. Add `completeSale()` calling repository. |
| `client/src/App.tsx` | On mount: seed DB if empty, start sync engine, load store info. |
| `client/src/pages/Login.tsx` | Replace `API.post` with local `db.users` lookup + PIN verification. Show setup wizard if no admin exists. |
| `client/src/pages/Register.tsx` | Replace `API.post` with `db.users.add()` + sync queue. |
| `client/src/pages/Sales.tsx` | Replace `API.post` with `SaleRepository.processSale()`. Add printer trigger. Payment method modal. |
| `client/src/pages/Inventory.tsx` | Replace `API.post` with `ProductRepository.batchImport()`. |
| `client/src/pages/Reports.tsx` | Compute all from local DB. |
| `client/src/pages/AdminDashboard.tsx` | Compute from local DB queries. |
| `client/src/pages/SalesRepDashboard.tsx` | Filter from local DB. |
| `client/src/components/Navbar.tsx` | Add sync status icon + pending count. |
| `client/src/components/ConnectivityIndicator.tsx` | Show sync relay connection status instead of generic offline. |
| `client/src/components/Sidebar.tsx` | Add printer status indicator. |

### Files to Create (server)

| File | Purpose |
|------|---------|
| `server/src/routes/sync.ts` | Sync endpoints — `POST /api/sync/push`, `GET /api/sync/pull` |
| `server/src/services/cloudSync.ts` | Background engine that pushes SQLite → Cloud and pulls Cloud → SQLite |
| `server/src/types/sync.ts` | Types for sync requests, responses, batch items |
| `server/src/db/migrations/002_sync_tables.ts` | New SQLite tables for sync metadata |

### Files to Modify (server)

| File | Changes |
|------|---------|
| `server/src/index.ts` | Add sync routes, start cloud sync engine on boot |
| `server/src/db/index.ts` | Run new migration, add sync-related models/tables |

---

## 5. Auth Flow (Offline)

```
────────────────────────────────────────────────────────────
FIRST LAUNCH (no admin exists in IndexedDB)
────────────────────────────────────────────────────────────

  1. App detects 0 users in db.users
  2. Shows "Setup Pharmacy" wizard:
     - Store name, address, phone, tax rate
     - Create admin account: name, email, PIN (4-6 digits)
  3. Admin PIN hashed with SHA-256 + salt
  4. Store info + admin user saved to IndexedDB
  5. On first sync: pushed to Express → stored in SQLite → pushed to cloud

────────────────────────────────────────────────────────────
SUBSEQUENT LAUNCHES (admin exists)
────────────────────────────────────────────────────────────

  1. Login screen: email + PIN
  2. App fetches user from db.users by email
  3. Hashes entered PIN, compares to stored hash
  4. If match → session token in Zustand, redirect by role
  5. If no match → error message
  ⚡ Entire flow is local — no network call

────────────────────────────────────────────────────────────
ADDING SALES ATTENDANTS (admin only)
────────────────────────────────────────────────────────────

  1. Admin navigates to /admin/users/new
  2. Fills: name, email, PIN, role
  3. App saves to db.users with hashed PIN + syncStatus: 'pending'
  4. Attendant can log in immediately — no internet needed
  5. User record queued for sync to Express → cloud

────────────────────────────────────────────────────────────
MULTI-DEVICE USER SYNC
────────────────────────────────────────────────────────────

  1. Admin creates user on Device A → saved to IndexedDB → pushed to Express
  2. Express stores in SQLite
  3. Device B pulls from Express → user appears in Device B's db.users
  4. Attendant can log in on Device B with same PIN
  ⚡ Attendant cannot log in until Device B has pulled at least once
```

---

## 6. Sale Flow (Offline)

```
1. Attendant opens /pos
2. Searches products → db.products.filter (instant)
3. Adds items to cart → Zustand cartStore (local state)
4. Taps "Checkout" → Payment modal opens
5. Selects payment method (Cash/Card/Mobile)
6. Enters amount tendered → app calculates change
7. Confirms → SaleRepository.processSale() runs:

   db.transaction('rw', db.sales, db.products, async () => {
     for (const item of cart) {
       // Deduct stock
       const product = await db.products.get(item.id)
       product.stock_quantity -= item.quantity
       await db.products.put(product)
     }
     // Create sale record
     const saleId = await db.sales.add({ ... })
     // Queue for sync
     syncQueue.add({ table: 'sales', action: 'create', ... })
     return saleId
   })

   ⚡ Entire transaction is local — completes in <50ms

8. Receipt screen appears → PrinterService.printReceipt(sale)
   - If printer connected: prints via WebUSB (ESC/POS)
   - If no printer: shows on-screen receipt + system print dialog fallback
   - Print job queued if printer unavailable

9. Sale queued for sync → Express relay → cloud
```

---

## 7. Inventory Flow (Offline)

```
────────────────────────────────────────────────────────────
ADD PRODUCT (admin)
────────────────────────────────────────────────────────────

  1. Admin fills form on /admin/inventory/new
  2. ProductRepository.add(product):
     - db.products.add({ ...product, updatedAt: Date.now(), syncStatus: 'pending' })
     - syncQueue.add({ table: 'products', action: 'create', ... })
  3. Product appears in inventory immediately
  4. Queued for sync → Express → cloud

────────────────────────────────────────────────────────────
BATCH IMPORT (admin)
────────────────────────────────────────────────────────────

  1. Admin uploads CSV on /admin/inventory/import
  2. CSV parsed client-side (same as current)
  3. ProductRepository.batchImport(parsedProducts):
     - db.products.bulkAdd(all products with syncStatus: 'pending')
     - syncQueue.add bulk entry
  4. Products visible immediately
  5. Full CSV data queued for sync → Express → cloud

────────────────────────────────────────────────────────────
STOCK ADJUSTMENT (admin)
────────────────────────────────────────────────────────────

  1. Admin navigates to /admin/inventory/adjust
  2. Selects product, enters delta (+/-), reason
  3. ProductRepository.adjustStock(id, delta, reason):
     - Validates stock won't go negative
     - Updates product stock_quantity + syncStatus: 'pending'
     - Logs to stockAdjustments table (audit trail)
     - Queues for sync
```

---

## 8. Reports Flow (Offline)

All reports computed locally from IndexedDB using Dexie queries. No API calls.

```typescript
// Concept — ReportsRepository (new additions to repository layer)

async getTodaySalesTotal(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const sales = await db.sales
    .filter(s => s.date.startsWith(today))
    .toArray()
  return sales.reduce((sum, s) => sum + s.grand_total, 0)
}

async getTopProducts(limit = 10): Promise<TopProductResult[]> {
  const sales = await db.sales.toArray()
  const productMap = new Map<number, number>()
  for (const sale of sales) {
    for (const item of sale.items || []) {
      productMap.set(item.id, (productMap.get(item.id) || 0) + item.quantity)
    }
  }
  return [...productMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, totalSold]) => ({ productId, totalSold }))
}

async getInventoryValue(): Promise<number> {
  const products = await db.products.toArray()
  return products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0)
}

async getLowStockCount(threshold = 10): Promise<number> {
  return db.products
    .where('stock_quantity')
    .belowOrEqual(threshold)
    .count()
}
```

---

## 9. What Is Maintained (unchanged)

| Area | Files | Why |
|------|-------|-----|
| UI Components | All `ui/*` (button, card, dialog, input, select, table) | shadcn primitives — pure presentation |
| Page Structure | All page components | Layout stays, only data source changes |
| Design System | DESIGN_SYSTEM.md, USER_FLOW.md | Already planned for offline-first |
| Route Structure | App.tsx routes | Already planned in USER_FLOW.md |
| Zustand Stores | cartStore (partial) | Cart stays in-memory, only checkout method changes |
| CSS/Tailwind | All stylesheets | Tailwind JIT — no changes needed |
| Toast System | Toast context/component | Works independently of data layer |
| Dexie DB | db/index.ts (structure) | Schema expands but foundation stays |
| Server Framework | Express + Sequelize + SQLite | Core stays, sync routes added on top |

---

## 10. What Changes

| Area | Files | What |
|------|-------|------|
| Data layer | `db/repository.ts` | Full rewrite — always local, transactional sales, stock adjustments |
| Sync layer | `db/sync.ts` | Full rewrite — two-way push/pull, conflict resolution |
| API calls in pages | `pages/Sales.tsx` and 5 others | Remove all `API.*` calls, use repository methods |
| Auth | `hooks/useAuth.ts`, `pages/Login.tsx`, `store/authStore.ts` | Local PIN verification, setup wizard |
| Reports | `hooks/useReports.ts`, `pages/Reports.tsx` | Local Dexie aggregations |
| Services | Delete `services/api.ts` | Replaced by sync service HTTP client |
| New services | Create `syncService.ts`, `printerService.ts` | Background sync engine, WebUSB printer |
| New hooks | Create `usePrinter.ts`, `useSyncStatus.ts` | Printer and sync state management |
| New tables | `db/index.ts` schema v2 | syncMeta, printJobs, storeInfo, stockAdjustments |
| Server | Add sync routes + cloud sync engine | Relay endpoints, periodic cloud sync |
| App init | `App.tsx` | Seed DB on first launch, start sync engine |
| Dev experience | None | Same `npm run dev` workflow |
| Dependencies | Add `escpos` buffer lib | For receipt data formatting |
| Server deps | Add node-fetch or axios | For cloud sync HTTP requests |
