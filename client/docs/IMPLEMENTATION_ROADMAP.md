# Implementation Roadmap

> Phased plan for the offline-first Pharmacy POS. Each phase builds on the previous. Phases 1-3 are the critical architecture shift; phases 4-7 are the design surface.

---

## Phase 0: Pre-Flight Audit

**Goal:** Map every `API.*` call in the client codebase. Identify all hard dependencies on the server being alive.

### Tasks

- [ ] Grep all `API.` calls across `src/pages/`, `src/hooks/`, `src/db/`
- [ ] List every endpoint and which page/hook calls it
- [ ] Categorize each: "remove & replace with local" vs "keep for sync relay"
- [ ] Check `server/src/routes/` for unused endpoints

### Known call sites to eliminate:

| File | Line(s) | Current Call | Replace With |
|------|---------|-------------|--------------|
| `pages/Login.tsx` | ~55 | `API.post('/auth/login')` | `db.users` local lookup + PIN verify |
| `pages/Register.tsx` | ~50 | `API.post('/auth/register')` | `db.users.add()` + sync queue |
| `pages/Sales.tsx` | ~20-22 | `API.post('/sales')` per cart item | `SaleRepository.processSale()` |
| `pages/Inventory.tsx` | ~212 | `API.post('/inventory/batch-import')` | `ProductRepository.batchImport()` |
| `hooks/useReports.ts` | ~18-26 | 6 `API.get()` calls | Local Dexie aggregations |
| `hooks/useAuth.ts` | ~13 | `API.post('/auth/login')` | Local `db.users` lookup |
| `hooks/useAuth.ts` | ~25 | `API.post('/auth/register')` | `db.users.add()` + sync queue |

---

## Phase 1: Core Data Layer (offline-first foundation)

**Goal:** Rewrite the data layer so every read/write targets IndexedDB. Nothing hits the network. This is the most critical phase.

### Client changes:

| File | Action |
|------|--------|
| `src/db/index.ts` | **Bump to schema v2.** Add tables: `syncMeta`, `printJobs`, `storeInfo`, `stockAdjustments`. Add fields: `updatedAt`, `syncedAt`, `syncStatus`. |
| `src/db/repository.ts` | **Full rewrite.** Remove all `navigator.onLine` branches. New methods: `ProductRepository.search()`, `.getLowStock()`, `.getExpiringSoon()`, `.getByCategory()`, `.adjustStock()`, `SaleRepository.getByUser()`, `.getByDateRange()`, `.processSale()` (transactional stock deduct + sale create). |
| `src/db/sync.ts` | **Full rewrite.** Replace simple queue with `SyncService` class — push to Express relay, pull from Express relay, conflict resolution by `updatedAt` timestamp, retry with backoff. |
| `src/db/seed.ts` | **Create.** First-launch seeder — 15-20 demo pharmacy products, admin user, store info, default config. |
| `src/services/syncService.ts` | **Create.** Background sync engine class. Timer-based (60s push, 120s pull). `.initialize()`, `.sync()`, `.forceSync()`, `.getStatus()`. HTTP client targeting Express relay. |
| `src/hooks/useSyncStatus.ts` | **Create.** React hook: `{ pendingPushes, lastSyncedAt, isSyncing, forceSync, relayConnected }`. |
| `src/types/sync.ts` | **Create.** Type definitions: `SyncQueueItem`, `SyncMeta`, `SyncResult`, `SyncBatchItem`, `SyncPullResponse`. |

### Server changes:

| File | Action |
|------|--------|
| `server/src/db/migrations/002_sync_tables.ts` | **Create.** SQLite migration: relay tables (`relay_products`, `relay_sales`, `relay_users`), sync logs, devices table, cloud_sync_meta. |
| `server/src/routes/sync.ts` | **Create.** Sync endpoints: `POST /api/sync/push`, `GET /api/sync/pull`, `POST /api/sync/register`, `GET /api/sync/status`. |
| `server/src/index.ts` | **Modify.** Mount sync routes. Start cloud sync engine on boot. |
| `server/src/config/sync.ts` | **Create.** Sync configuration: batch sizes, intervals, cloud endpoint, retry settings. |
| `server/src/types/sync.ts` | **Create.** Request/response types for sync endpoints. |
| `server/package.json` | **Modify.** Add `axios` (or `node-fetch`) for cloud HTTP calls. |
| `server/.env` | **Modify.** Add `CLOUD_SYNC_URL`, `CLOUD_API_KEY`. |

### Verification:

- `npm run build` on both client and server
- `ProductRepository.getAll()` returns products from IndexedDB instantly (no API call)
- `SaleRepository.processSale()` deducts stock + creates sale in one Dexie transaction
- New sale appears in `SalesRepository.getAll()` immediately
- Sync queue populates when data is created
- Express relay accepts `POST /api/sync/push` and stores in SQLite
- Express relay serves `GET /api/sync/pull` with pending changes
- The app works fully with the server stopped (no errors, no spinners)

---

## Phase 2: Authentication (local PIN)

**Goal:** Replace JWT cloud auth with local PIN-based login. Add first-launch setup wizard.

### Client changes:

| File | Action |
|------|--------|
| `src/hooks/useAuth.ts` | **Rewrite.** Remove all `API.post` calls. Add `hashPin()` using `crypto.subtle.digest('SHA-256')`. Login validates against `db.users`. Register saves locally + sync queue. |
| `src/store/authStore.ts` | **Modify.** Remove JWT token logic. Add `deviceId` (generated once, persisted). Add `pinHash`. Add `isFirstLaunch` flag. |
| `src/pages/Login.tsx` | **Rewrite.** If no admin in `db.users` → redirect to setup wizard. PIN input instead of password (if PIN configured). Demo credentials removed (or shown from seed data). New "Setup Pharmacy" as link when no admin exists. |
| `src/pages/Register.tsx` | **Rewrite.** Admin-only user creation. Fields: name, email, PIN, confirm PIN. PIN strength indicator. Saves to `db.users` with `syncStatus: 'pending'`. |

### Verification:

- First launch → setup wizard appears (no login screen)
- Setup wizard creates admin account + store info
- Login with correct PIN → success
- Login with wrong PIN → error
- Registration creates user visible in IndexedDB
- Created user can log in immediately (no internet needed)
- Auth works with Express server stopped

---

## Phase 3: Reports & Dashboards (local computation)

**Goal:** All reports compute from IndexedDB. Zero API calls. Dashboards render instantly from local data.

### Client changes:

| File | Action |
|------|--------|
| `src/hooks/useReports.ts` | **Rewrite.** Remove all 6 `API.get` calls. Implement local aggregation functions: `getTodaySales()`, `getWeeklySales()`, `getMonthlySales()`, `getTopProducts()`, `getInventoryStatus()`. All use Dexie `.filter().toArray()` + reduce. |
| `src/pages/Reports.tsx` | **Modify.** Remove loading state for API calls. Data comes from local hook. Skeleton loading while Dexie queries run (<5ms for typical data sizes). |
| `src/pages/AdminDashboard.tsx` | **Modify.** Compute KPI stats from local Dexie queries. Use `Skeleton` component during first load. Remove all API calls. |
| `src/pages/SalesRepDashboard.tsx` | **Modify.** Same — local queries. Filter sales by `user_id`. Compute commission locally. |
| `src/hooks/useSales.ts` | **Modify.** Remove API dependency — `SaleRepository.getAll()` is already local after Phase 1. |
| `src/hooks/useProducts.ts` | **Modify.** Same — `ProductRepository.getAll()` is already local. |

### Verification:

- Dashboard stats render instantly (no spinners)
- Reports page shows data without any API calls
- Network tab shows zero requests to server during normal operation
- Switching report tabs is instant
- Dashboard works with server stopped

---

## Phase 4: Delete Old Services

**Goal:** Remove the old online-first service layer. No remaining code paths reach for the network.

### Client changes:

| File | Action |
|------|--------|
| `src/services/api.ts` | **Delete.** Entire file removed. No more Axios instance with JWT interceptor. |
| `src/services/` | Clean up — only `syncService.ts` and `printerService.ts` remain. |

### Verification:

- `npm run build` succeeds with `api.ts` removed
- No `import ... from '../services/api'` errors anywhere
- Search for `API.` throughout src returns zero results

---

## Phase 5: Design System (UI)

**Goal:** Apply the design system from DESIGN_SYSTEM.md. Visual overhaul.

> **Note:** This phase is UI-only. The offline-first architecture is already in place. These changes are purely visual.

### Files to change (from original DESIGN_SYSTEM.md phases, now applied on top of offline architecture):

| File | Action |
|------|--------|
| `tailwind.config.js` | Add fontFamily, custom animation keyframes. |
| `index.css` | Update color tokens (blue/green pharmacy palette). @font-face for Satoshi. Google Fonts import. Custom keyframes (slide-in, pulse variants). |
| `src/components/ui/skeleton.tsx` | Create. |
| `src/components/ui/badge.tsx` | Create. |
| `App.css` | Delete — all migrated. |
| `App.tsx` | Remove `import './App.css'`. Tailwind layout classes. |
| `Navbar.tsx` | Redesign with new tokens. Add sync status indicator. |
| `Sidebar.tsx` | Redesign with Lucide icons, active states, user info from store. |
| `Toast.tsx` | Tailwind styling + Lucide icons. |
| `ConnectivityIndicator.tsx` | Show sync relay status instead of generic offline. |
| `Login.tsx`, `Register.tsx` | Split-panel brand layout. |
| `AdminDashboard.tsx`, `SalesRepDashboard.tsx` | Accent-bar stat cards, skeleton loading. |
| `Sales.tsx`, `Inventory.tsx`, `Reports.tsx` | Refined cards, sticky cart, better empty states. |

### Verification:

- Visual match to DESIGN_SYSTEM.md specifications
- Skeleton components render during data loading
- Dark mode toggles correctly
- All interactive elements have hover/focus states
- `npm run build` succeeds, no raw CSS classes in output

---

## Phase 6: Receipt Printing

**Goal:** ESC/POS thermal printing via WebUSB.

### Client changes:

| File | Action |
|------|--------|
| `src/services/printerService.ts` | **Create.** WebUSB device connection, ESC/POS byte buffer construction, receipt layout, paper cut. |
| `src/hooks/usePrinter.ts` | **Create.** React hook: `{ connected, connect, disconnect, print, status }`. |
| `src/types/printer.ts` | **Create.** `PrinterState`, `PrintJob`, `ReceiptLine` types. |
| `src/pages/Sales.tsx` | **Modify.** After sale completes, call `printerService.printReceipt(sale)`. Add "Print" button to receipt view. |
| `src/pages/AdminDashboard.tsx` / `Reports.tsx` | **Modify.** "Print" button on reports for hard-copy summary. |

### Verification:

- "Find Printer" button opens browser USB device picker
- Printer connects and shows status (Ready/Paper Out/Error)
- Test page prints correctly
- Receipt prints after sale completion
- ESC/POS formatting is correct (centered header, item columns, totals, barcode, cut)
- Print job queues if printer unavailable and retries on reconnect

---

## Phase 7: Polish & Dark Mode

**Goal:** Final refinement, reduced-motion support, dark mode.

### Tasks:

- [ ] Add `@media (prefers-reduced-motion: reduce)` wrapper for all animations
- [ ] Verify all interactive elements have `focus-visible` ring styles
- [ ] Add `transition-all duration-150` to Card hover, Sidebar links, Button press
- [ ] Implement dark mode toggle (`.dark` class on `<html>`, persisted in `storeInfo`)
- [ ] Audit all pages for consistent `p-6` page padding + `space-y-6` section gaps
- [ ] Remove any remaining emoji icons — replace with Lucide equivalents
- [ ] Final `npm run build` on both client and server
- [ ] Verify zero `API.` references in client code
- [ ] Verify zero raw CSS class leaks (no `.App`, `.app-content`, `.toast`, `.offline-banner`)

---

## Summary: What Changes vs What Stays

```
                    ┌─────────────────────────────────────────────────────┐
                    │                   CLIENT                            │
                    ├──────────────────────┬──────────────────────────────┤
                    │     CHANGES           │        STAYS                 │
                    ├──────────────────────┼──────────────────────────────┤
                    │ db/repository.ts      │ All ui/* components         │
                    │ db/sync.ts            │ Page components (structure) │
                    │ db/index.ts (schema)  │ Route structure             │
                    │ hooks/useAuth.ts      │ Zustand cartStore           │
                    │ hooks/useReports.ts   │ Toast context               │
                    │ services/api.ts (del) │ Tailwind/PostCSS config     │
                    │ pages/Login.tsx       │ DESIGN_SYSTEM.md plan       │
                    │ pages/Register.tsx    │ USER_FLOW.md plan           │
                    │ pages/Sales.tsx       │                             │
                    │ pages/Inventory.tsx   │                             │
                    │ App.css (delete)      │                             │
                    │ Navbar, Sidebar,      │                             │
                    │ Toast, ConnectInd.    │                             │
                    │ + new: syncService,   │                             │
                    │   printerService,     │                             │
                    │   hooks, seed, types  │                             │
                    ├──────────────────────┴──────────────────────────────┤
                    │                   SERVER                            │
                    ├──────────────────────┬──────────────────────────────┤
                    │ routes/sync.ts (new)  │ routes/auth.ts              │
                    │ services/cloudSync.ts │ routes/inventory.ts         │
                    │ config/sync.ts (new)  │ routes/sales.ts             │
                    │ db/migrations/002.ts  │ routes/users.ts             │
                    │ .env (new vars)       │ Sequelize models            │
                    │ package.json (deps)   │ Middleware (CORS, auth)     │
                    └──────────────────────┴──────────────────────────────┘
```

---

## Effort Estimate

| Phase | Focus | Est. Days | Dependencies |
|-------|-------|-----------|-------------|
| 0 | Pre-flight audit | 0.5 | — |
| 1 | Data layer (offline) | 5 | Phase 0 |
| 2 | Auth (local PIN) | 2 | Phase 1 |
| 3 | Reports (local) | 2 | Phase 1 |
| 4 | Delete old services | 0.5 | Phase 1-3 |
| 5 | Design system (UI) | 5 | Phase 4 |
| 6 | Printing | 3 | Phase 5 |
| 7 | Polish | 2 | Phase 6 |
| **Total** | | **20** | |
