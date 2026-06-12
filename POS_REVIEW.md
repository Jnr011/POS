# Pharmacy POS System — Comprehensive Audit & Roadmap

> **Generated**: June 11, 2026  
> **Scope**: Full codebase review, offline-first feasibility, simplification strategy

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete File Inventory](#2-complete-file-inventory)
3. [Architecture Deep Dive](#3-architecture-deep-dive)
4. [Critical Issues](#4-critical-issues)
5. [Code Quality Issues](#5-code-quality-issues)
6. [Security Audit](#6-security-audit)
7. [Offline-First Feasibility](#7-offline-first-feasibility)
8. [Simplicity-First Restructuring Plan](#8-simplicity-first-restructuring-plan)
9. [Feature Roadmap](#9-feature-roadmap)
10. [What to Remove](#10-what-to-remove)
11. [Recommended Tech Stack](#11-recommended-tech-stack)
12. [Scalability Guidelines](#12-scalability-guidelines)

---

## 1. Project Overview

### Current State

| Aspect | Detail |
|---|---|
| **Type** | Pharmacy Point-of-Sale System |
| **Frontend** | React 18 SPA (Vite 5 bundler) |
| **Backend** | Express 4 REST API (Sequelize ORM) |
| **Database** | SQLite in-memory (`:memory:`) — **all data lost on restart** |
| **Auth** | JWT (1-day expiry) + bcrypt |
| **Roles** | `admin`, `sales` |
| **Total Files** | 48 (29 client, 15 server, 4 root config) |
| **API Endpoints** | 19 (4 auth, 7 inventory, 4 sales, 5 reports + health) |
| **Testing** | None |
| **Type Safety** | None (vanilla JS, no TypeScript) |
| **State Management** | localStorage + `useState` only |

### What Works Correctly

- JWT login/register/logout flow
- Role-based routing and sidebar
- Product CRUD (create, read, update, delete)
- Sale creation with stock deduction
- CSV batch import with client-side parsing and preview
- Daily/weekly/monthly sales reports
- Low-stock detection (threshold: 10)
- Top products reporting
- Admin seeding on startup

---

## 2. Complete File Inventory

### Root (4 files)

| File | Purpose | Status |
|---|---|---|
| `readme.md` | Project documentation (410 lines, duplicated/contradictory) | ❌ Needs rewrite |
| `ROLE_BASED_SYSTEM_GUIDE.md` | Role-based access guide | ✅ Accurate |
| `SETUP_DATABASE.sql` | MySQL schema (unused — app uses SQLite) | ❌ Dead |
| `setup.sql` | Alternate MySQL schema (unused) | ❌ Dead |

### Client — `client/` (29 files)

| File | Lines | Purpose | Status |
|---|---|---|---|
| `package.json` | — | Dependencies: react 18, axios, react-router-dom v6, vite 5 | ✅ |
| `vite.config.js` | — | Vite config with proxy (⚠️ has rewrite bug) | ⚠️ Buggy |
| `index.html` | — | HTML entry point | ✅ |
| `.env.example` | — | Template: `REACT_APP_API_URL` | ✅ |
| `public/manifest.json` | — | Basic PWA manifest | ⚠️ Minimal |
| `src/main.jsx` | 11 | React DOM render + BrowserRouter | ✅ |
| `src/App.jsx` | 89 | Root: auth state, routing, role dispatch | ✅ |
| `src/App.css` | 43 | Global flexbox layout | ✅ |
| `src/index.css` | 7 | CSS reset | ✅ |
| `src/services/api.js` | 22 | Axios instance + JWT interceptor | ✅ |
| `src/components/Navbar.jsx` | 24 | Top bar with title + logout | ✅ |
| `src/components/Sidebar.jsx` | 77 | Role-aware nav menu | ⚠️ Shows `ADMIN2024` code |
| `src/pages/Login.jsx` | 82 | Login form + demo creds | ✅ |
| `src/pages/Register.jsx` | 199 | Sales rep registration form | ✅ |
| `src/pages/Dashboard.jsx` | 90 | **Dead** — superseded by AdminDashboard | ❌ Remove |
| `src/pages/AdminDashboard.jsx` | 132 | Admin stats cards + registration code | ✅ |
| `src/pages/SalesRepDashboard.jsx` | 148 | Sales rep stats + recent sales + quick actions | ✅ |
| `src/pages/Sales.jsx` | 124 | Product grid + cart + checkout | ✅ |
| `src/pages/Inventory.jsx` | 427 | Product CRUD form + table + CSV import | ✅ |
| `src/pages/Reports.jsx` | 209 | Tabbed reports: daily/weekly/monthly/inventory/top | ✅ |
| `src/styles/Navbar.css` | — | Dark navbar | ✅ |
| `src/styles/Sidebar.css` | — | Dark sidebar with hover | ✅ |
| `src/styles/Login.css` | — | Centered card + gradient | ✅ |
| `src/styles/Register.css` | — | Two-column layout | ✅ |
| `src/styles/Dashboard.css` | — | Card grid stats | ✅ |
| `src/styles/Sales.css` | — | Two-column sales layout | ✅ |
| `src/styles/Inventory.css` | — | Form + table + CSV drop zone | ✅ |
| `src/styles/Reports.css` | — | Tab nav + report tables | ✅ |

### Server — `server/` (15 files)

| File | Lines | Purpose | Status |
|---|---|---|---|
| `package.json` | — | Dependencies: express, sequelize, sqlite3, bcryptjs, jwt, dotenv | ✅ |
| `.env.example` | — | Template: DB_HOST, DB_USER, DB_PASSWORD, etc. | ⚠️ Unused fields |
| `src/server.js` | 70 | Express app: CORS, DB connect, model sync, admin seed, routes | ✅ |
| `src/config/database.js` | 11 | Sequelize: **SQLite `:memory:`** | ❌ Blocker |
| `src/middleware/authMiddleware.js` | 19 | JWT verify → `req.userId`, `req.userRole` | ✅ |
| `src/models/user.js` | 25 | Fields: name, email, password, role | ✅ |
| `src/models/product.js` | 28 | Fields: name, category, price, stock_quantity, expiry_date | ✅ |
| `src/models/sale.js` | 24 | Fields: product_id, quantity, total_price, date | ⚠️ No FK |
| `src/routes/auth.js` | 8 | POST register/login/logout, GET me | ✅ |
| `src/routes/inventory.js` | 14 | GET/POST/PUT/DELETE + low-stock + batch-import | ✅ |
| `src/routes/sales.js` | 8 | GET all/by-id, POST, GET daily/summary | ✅ |
| `src/routes/reports.js` | 9 | GET daily/weekly/monthly/inventory/top-products | ✅ |
| `src/controllers/authController.js` | 84 | Register/login/logout/me logic | ✅ |
| `src/controllers/inventoryController.js` | 159 | CRUD + low stock + batch import | ⚠️ Duplicate methods |
| `src/controllers/salesController.js` | 79 | Create sale (with stock deduct), list, daily filter | ⚠️ No transaction |
| `src/controllers/reportController.js` | 93 | Aggregated reports | ⚠️ Duplicate methods |

---

## 3. Architecture Deep Dive

### Data Flow

```
User Browser  ←→  Vite Dev (port 3000)  --proxy→  Express API (port 5000)  --Sequelize→  SQLite (:memory:)
                                       (Axios direct in production)                        (data lost on restart)
```

### State Management

- **No global state library**: Uses `localStorage` for auth (token + user object)
- **No Context API**: Auth state lifted to `App.jsx`, passed via props
- **No React Query/TanStack Query**: Every component fetches data inline with `useEffect`
- **Pattern**: `useState` + `useEffect` + `localStorage` in every page

### Routing

- `react-router-dom` v6 with `<BrowserRouter>`
- Routes conditionally rendered based on `user.role` from localStorage
- `DashboardRoute` component redirects to `AdminDashboard` or `SalesRepDashboard` by role
- No route guards/ProtectedRoute component — auth checks inline in each `<Route>` element

### API Pattern

- Single Axios instance with `baseURL: 'http://localhost:5000/api'`
- Request interceptor adds `Bearer <token>` from localStorage
- **Every component manually attaches `Authorization` header** — the Axios interceptor already does this, so these are redundant

### CSS

- 8 standalone CSS files, one per page/component
- Dark sidebar + navbar theme
- Gradient backgrounds on login/register
- Card-based dashboard layouts
- No CSS variables, no design tokens, no responsive breakpoints pattern

---

## 4. Critical Issues

### 🚨 BLOCKER: Data Loss on Restart

**File**: `server/src/config/database.js:7`
```js
storage: ':memory:'
```

The server uses SQLite in-memory database. Every restart wipes all products, sales, and user registrations. The `.env.example` contains MySQL variables (`DB_HOST`, `DB_USER`) that are **never read** by any code.

**Fix**: Change to persistent file: `storage: './data/pos.db'` (create `data/` directory).

### 🚨 BLOCKER: Vite Proxy Rewrite Bug

**File**: `client/vite.config.js:15`
```js
rewrite: (path) => path.replace(/^\/api/, '')
```

This strips `/api` from the path before proxying, so `/api/auth/login` becomes `/auth/login`. But the backend mounts routes at `/api/auth`, `/api/inventory`, etc. In development, the Axios instance uses `http://localhost:5000/api` directly (bypassing the proxy), so it works. The proxy rewrite is broken but unused during dev. **In a production build served through the Express server, all API calls would fail.**

### 🚨 HIGH: No Sequelize Associations

No `belongsTo`, `hasMany` relationships defined. `Sale.product_id` has no foreign key constraint. Reports that need product names would require manual joins. Currently, reports show `product_id` numbers instead of names.

### 🚨 HIGH: Sale Creation Not Atomic

**File**: `server/src/controllers/salesController.js:45-51`
```js
const sale = await Sale.create({ ... });
await product.update({ stock_quantity: product.stock_quantity - quantity });
```

If the server crashes between these two lines, the sale is recorded but stock is not deducted (or vice versa). Must use `sequelize.transaction()`.

### 🚨 HIGH: Hardcoded Admin Registration Code

`ADMIN2024` is hardcoded in:
- `authController.js:15` — backend validation
- `Sidebar.jsx:59` — visible to all users
- `AdminDashboard.jsx:115` — displayed with copy button

This code is not configurable via environment variables.

### 🚨 HIGH: CORS Wide Open

```js
res.header('Access-Control-Allow-Origin', '*');
```

Allows any origin to call the API. Fine for development but needs restriction in production.

### ⚠️ HIGH: README Misleading

The README references:
- Python/Django backends
- MySQL/PostgreSQL databases
- Sequelize migrations (`npx sequelize-cli db:migrate`)
- Features that don't exist (barcode scanning, tax rates, discounts, receipt templates, user management section, system settings)

The README appears to be a merged/compiled document with duplicate sections (Installation appears twice, API Documentation twice, Database Schema three times).

---

## 5. Code Quality Issues

### Dead Code

| Location | Issue |
|---|---|
| `client/src/pages/Dashboard.jsx` | Superseded by `AdminDashboard.jsx` but still imported in `App.jsx:7` |
| `inventoryController.js:89-95` | `getProducts()` and `addProduct()` are aliases that delegate to `getAllProducts()` and `createProduct()` |
| `salesController.js:73-79` | `getSales()` and `processSale()` are aliases |
| `reportController.js:87-93` | `generateSalesReport()` and `generateInventoryReport()` are aliases |
| `server/package.json` | `csv-parser` installed but not used (CSV parsing is client-side) |
| `server/package.json` | `multer` installed but not used (batch import accepts JSON body) |

### Redundant Code

Every page manually reads the token from `localStorage` and adds `Authorization` headers, but the Axios interceptor in `api.js` already does this. 107 lines of boilerplate could be removed.

```
client/src/pages/Login.jsx:21       localStorage.setItem('token', ...)
client/src/pages/Login.jsx:22       localStorage.setItem('user', ...)
client/src/pages/Sales.jsx:14-17    Manually adds Authorization header
client/src/pages/Sales.jsx:49-53    Manually adds Authorization header
client/src/pages/Inventory.jsx:29-32  Same pattern (x5 in this file)
client/src/pages/AdminDashboard.jsx:28-31  Same pattern
client/src/pages/SalesRepDashboard.jsx:29-31  Same pattern
client/src/pages/Reports.jsx:23-28  Same pattern
```

### Inefficient Data Fetching

- **Reports page** fetches all 5 report types on mount, even though only one tab is visible
- **Sales page** fetches all products with no search/filter/pagination
- **SalesRepDashboard** fetches ALL sales then filters in-memory for "today's sales" and "recent 5"
- **AdminDashboard** hits reports endpoint but doesn't fetch today's sales separately (stays at 0)

### UX Issues

| Issue | Location | Impact |
|---|---|---|
| Uses `alert()` for errors/success | Multiple pages | Blocks UI, no undo |
| "Loading..." text only | Multiple pages | No skeleton/spinner |
| No product search on Sales page | `Sales.jsx` | Hard to find products with large inventory |
| Reports show `product_id` not name | `Reports.jsx:87` | Useless to end users |
| Sales don't track which user made sale | `sale.js` | Can't attribute per sales rep |
| No pagination anywhere | — | Scales poorly |
| `expiry_date` required in form | `Inventory.jsx:287` | Non-expiring products can't be added |
| Price displays shown as raw numbers | Multiple | No currency formatting helper |

---

## 6. Security Audit

| Issue | Severity | Detail |
|---|---|---|
| In-memory DB (data loss) | Critical | All data ephemeral |
| Hardcoded registration code | High | `ADMIN2024` baked into 3 files |
| CORS wildcard | High | Any origin can call API |
| JWT stored in localStorage | Medium | XSS-vulnerable (no httpOnly cookie) |
| No rate limiting | Medium | Brute-force login possible |
| No input validation library | Medium | No express-validator, Joi, or Zod |
| No Helmet.js | Low | Missing security headers |
| No SQL injection protection | Low | Sequelize parameterizes queries (safe) |
| Demo credentials visible | Low | `admin@pharmacy.com` / `admin@123` shown on login page |

---

## 7. Offline-First Feasibility

### Assessment: ✅ HIGHLY FEASIBLE

A pharmacy POS is an ideal candidate for offline-first:
- Transactions are simple (create sale, update stock)
- Data volumes are moderate
- Conflicts are rare (one POS terminal per location)
- Network connectivity is unreliable in many pharmacy settings

### Required Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Browser                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Data Access Layer                    │   │
│  │  ┌──────────────┐  ┌──────────┐  ┌────────────┐ │   │
│  │  │ Online: API  │  │ Offline: │  │ Sync       │ │   │
│  │  │ via Axios    │  │ Dexie.js │  │ Engine     │ │   │
│  │  │              │  │ (Indexed │  │ (push/pull)│ │   │
│  │  │              │  │   DB)    │  │            │ │   │
│  │  └──────────────┘  └──────────┘  └─────┬──────┘ │   │
│  │                                         │        │   │
│  │  ┌──────────────┐  ┌──────────────┐    │        │   │
│  │  │ Zustand Store │  │ Offline      │    │        │   │
│  │  │ (auth, cart,  │  │ Mutation     │◄───┘        │   │
│  │  │  status)      │  │ Queue        │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Worker (Workbox)                        │   │
│  │  - Cache static assets (App Shell)               │   │
│  │  - Cache API responses (stale-while-revalidate)  │   │
│  │  - Background Sync for queued mutations          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Express API                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth     │  │ CRUD Routes  │  │ Sync Endpoint    │  │
│  │ Routes   │  │ (inventory,  │  │ POST /api/sync   │  │
│  │          │  │  sales, etc) │  │ (batch mutations)│  │
│  └──────────┘  └──────┬───────┘  └──────────────────┘  │
│                       │                                 │
│                       ▼                                 │
│              ┌────────────────┐                         │
│              │  Sequelize ORM │                         │
│              │  (persistent   │                         │
│              │   SQLite file) │                         │
│              └────────────────┘                         │
└──────────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Local DB** | Dexie.js (IndexedDB wrapper) | Simple API, good perf, widely used |
| **ID Strategy** | Client-generated UUIDs (`crypto.randomUUID()`) | Avoids conflicts, works offline |
| **Conflict Strategy** | Last-write-wins (server authority) | Acceptable for POS, simple to implement |
| **Sync Trigger** | Periodic (every 30s) + on reconnect + manual refresh | Balances freshness vs battery |
| **Offline Detection** | `navigator.onLine` + periodic health check pings | More reliable than single event |
| **Queue Storage** | IndexedDB (same Dexie DB, separate table) | Atomic with local data |

### Implementation Plan

| Step | What | Effort | Dependencies |
|---|---|---|---|
| 1 | Switch to persistent SQLite file | 30min | — |
| 2 | Add UUID generation to models (client + server) | 1h | — |
| 3 | Install Dexie.js, set up local database schema | 2h | — |
| 4 | Create Data Access Layer (reads from IndexedDB, writes to both) | 4h | Step 3 |
| 5 | Create offline mutation queue | 3h | Step 3 |
| 6 | Create sync engine (push queue → pull server changes) | 4h | Steps 4, 5 |
| 7 | Add Service Worker with Workbox | 3h | — |
| 8 | Add connectivity detection + UI indicators | 2h | — |
| 9 | Add `/api/sync` endpoint to server | 2h | Step 1 |
| 10 | Test full offline → online → conflict resolution flow | 3h | All above |

**Total estimated effort**: ~24h (3-4 days for one developer)

### Libraries to Add

```
npm install dexie uuid                # client
npm install workbox-webpack-plugin    # client (dev)
npm install uuid                      # server
```

---

## 8. Simplicity-First Restructuring Plan

### Phase 1: Quick Wins (1-2 days)

```
1. Fix data persistence     → database.js: storage: './data/pos.db'
2. Create .env files        → from .env.example templates
3. Fix proxy rewrite bug    → Remove rewrite line from vite.config.js (or fix)
4. Remove dead code         → Dashboard.jsx, duplicate controller methods
5. Remove unused deps       → csv-parser, multer
6. Fix redundant headers    → Remove manual Authorization headers (interceptor handles it)
7. Add product name to      → Join with Products table in sales route
   reports
8. Add user_id to Sale      → Track which user made each sale
   model
```

### Phase 2: Data Layer Foundation (2-3 days)

```
1. Add Sequelize associations → Sale.belongsTo(Product), Sale.belongsTo(User)
2. Wrap sales in transaction  → sequelize.transaction()
3. Abstract API calls         → Custom hooks: useProducts(), useSales(), useAuth()
4. Add Zustand store          → auth, cart, connectivity state
5. Add Zod validation schemas → Shared between client forms + server validation
6. Add pagination             → All list endpoints get page/limit params
```

### Phase 3: UX Overhaul (2-3 days)

```
1. Replace alert()            → Toast notification system
2. Replace "Loading..."       → Skeleton loaders
3. Add product search         → Sales page search/filter
4. Add sales rep filter       → Sales rep sees only their sales
5. Add currency formatting    → Shared utility function
6. Make expiry_date optional  → Non-expiring products
7. Add error boundaries       → Catch React errors gracefully
```

### Phase 4: Offline-First (3-5 days)

```
Implementation per Section 7 above
```

### Phase 5: Production Hardening (2-3 days)

```
1. Add rate limiting          → express-rate-limit
2. Add Helmet security headers
3. Add testing                → Vitest + React Testing Library + Supertest
4. Add CI/CD                  → GitHub Actions
5. Clean up README            → Single accurate version
6. Add TypeScript             → Incremental adoption
```

---

## 9. Feature Roadmap

### P0 — Must Fix (Data Integrity)

| Feature | Effort | Why |
|---|---|---|
| Persistent SQLite file | 30min | Without this, app is unusable |
| Sale transaction wrapping | 1h | Data corruption risk |
| Sequelize associations | 1h | Data integrity |
| Fix proxy rewrite | 15min | Production build fix |

### P1 — Core POS Features

| Feature | Effort | Why |
|---|---|---|
| Product search on Sales | 2h | Essential UX for large inventory |
| Sales rep attribution | 2h | Who sold what? |
| Product names in reports | 1h | Reports are useless without this |
| Receipt generation (print) | 1d | Every POS needs receipts |
| Payment method tracking | 1d | Cash/card/mobile money split |
| Low-stock notifications | 4h | Inventory management |

### P2 — Major Improvements

| Feature | Effort | Why |
|---|---|---|
| Offline-first (full) | 3-5d | Core requirement |
| UI component system | 2d | Consistency + speed |
| CSV export (reports) | 4h | Data portability |
| Toast notifications | 4h | UX improvement |
| Pagination | 4h | Scale to 1000s of products |

### P3 — Nice to Have

| Feature | Effort |
|---|---|
| Barcode scanning (camera) | 2d |
| Dark mode | 1d |
| Email receipts | 2d |
| Multi-language | 3d |
| Advanced analytics (charts) | 2d |

---

## 10. What to Remove

| File / Code | Reason |
|---|---|
| `client/src/pages/Dashboard.jsx` | Dead code — superseded by `AdminDashboard.jsx` |
| `Dashboard` import in `App.jsx:7` | Dead import |
| `inventoryController.js:89-95` `getProducts()` / `addProduct()` | Dead alias methods |
| `salesController.js:73-79` `getSales()` / `processSale()` | Dead alias methods |
| `reportController.js:87-93` `generateSalesReport()` / `generateInventoryReport()` | Dead alias methods |
| `csv-parser` from `server/package.json` | Never used (parsing is client-side) |
| `multer` from `server/package.json` | Never used (batch import is JSON body) |
| `SETUP_DATABASE.sql` | Not used (app uses SQLite, not MySQL) |
| `setup.sql` | Not used |
| `readme.md` lines 209-410 | Duplicate/contradictory content (Rewrite recommended) |
| Manual `Authorization` headers in all pages (107 lines total) | Axios interceptor already handles this |
| Vite proxy `rewrite` line | Broken — strips `/api` prefix |

---

## 11. Recommended Tech Stack

### Current vs Proposed

| Layer | Current | Proposed | Reason |
|---|---|---|---|
| **Language** | JavaScript | **TypeScript** | Type safety, maintainability |
| **UI Framework** | React 18 | **React 18** | ✅ Keep |
| **Build Tool** | Vite 5 | **Vite 6** | Incremental upgrade |
| **Routing** | React Router v6 | **React Router v7** | Loaders/actions pattern |
| **State (global)** | localStorage | **Zustand** | Simple, performant, no boilerplate |
| **State (server)** | useEffect + fetch | **TanStack Query** | Caching, refetch, optimistic updates |
| **Validation** | Inline checks | **Zod** | Shared schemas client + server |
| **CSS** | Plain CSS files | **Tailwind CSS** | Rapid development, consistency |
| **Components** | None | **shadcn/ui** | Accessible, composable, themed |
| **Database** | SQLite `:memory:` | **SQLite (file)** | Persistent, zero-config |
| **ORM** | Sequelize | **Drizzle ORM** | TypeScript-native, lighter (or stay on Sequelize) |
| **Testing** | None | **Vitest + RTL + Supertest** | Fast, Vite-compatible |
| **Offline DB** | None | **Dexie.js** | Simple IndexedDB wrapper |
| **PWA/SW** | None | **Workbox** | Caching + background sync |

---

## 12. Scalability Guidelines

### Principles for Adding Features Without Breaking the App

1. **Repository Pattern**
   - Every data source (API, IndexedDB, local) is accessed through a repository
   - Components never call `API.get()` directly
   - Swap implementations without changing components

   ```
   // ✅ Do this:
   const { data: products } = useProducts({ search, page, category })
   
   // ❌ Not this:
   const [products, setProducts] = useState([])
   useEffect(() => {
     API.get('/inventory').then(res => setProducts(res.data.products))
   }, [])
   ```

2. **Feature-Based Folder Structure**
   - Group by feature, not by file type
   - Each feature owns its components, hooks, types, and tests

   ```
   src/
   ├── features/
   │   ├── auth/
   │   │   ├── Login.tsx
   │   │   ├── Register.tsx
   │   │   ├── useAuth.ts
   │   │   └── auth.schema.ts
   │   ├── sales/
   │   │   ├── Sales.tsx
   │   │   ├── Cart.tsx
   │   │   ├── Checkout.tsx
   │   │   ├── useProducts.ts
   │   │   └── sales.schema.ts
   │   └── inventory/
   │       ├── Inventory.tsx
   │       ├── ProductForm.tsx
   │       ├── CSVImport.tsx
   │       └── useInventory.ts
   ├── shared/
   │   ├── components/   # Generic UI components
   │   ├── hooks/        # Cross-feature hooks
   │   └── utils/        # Utilities
   └── db/               # Data layer (Dexie, sync, API repository)
   ```

3. **Shared Validation**
   - Zod schemas defined once, used on both client forms + server validation
   - Changing a field's constraints updates everywhere

4. **Single Source of Truth for Auth**
   - Zustand store holds auth state
   - localStorage is write-only (persist middleware)
   - Components read from store, not localStorage directly

5. **Avoid Premature Abstraction**
   - Start simple (custom hooks per feature)
   - Extract shared logic only when 3+ places use it
   - Keep components small (under 200 lines)

6. **API Versioning from Day 1**
   - Mount all routes under `/api/v1/`
   - Allows breaking changes without breaking existing clients

---

## Appendix A: Database Schema (Proposed)

```sql
-- Persistent SQLite (file-based)
-- Managed via Sequelize migrations

users
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  name          TEXT NOT NULL
  email         TEXT UNIQUE NOT NULL
  password      TEXT NOT NULL
  role          TEXT NOT NULL CHECK(role IN ('admin', 'sales'))
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP

products
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  name          TEXT NOT NULL
  category      TEXT NOT NULL
  price         DECIMAL(10,2) NOT NULL
  stock_quantity INTEGER NOT NULL DEFAULT 0
  expiry_date   DATE
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP

sales
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  product_id    INTEGER NOT NULL REFERENCES products(id)
  user_id       INTEGER NOT NULL REFERENCES users(id)
  quantity      INTEGER NOT NULL CHECK(quantity > 0)
  total_price   DECIMAL(10,2) NOT NULL
  payment_method TEXT DEFAULT 'cash'
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP

-- Indexes
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_products_category ON products(category);
```

## Appendix B: Environment Variables (Recommended)

```env
# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=<generate-random-64-char-string>
DB_PATH=./data/pos.db
ADMIN_EMAIL=admin@pharmacy.com
ADMIN_PASSWORD=<generate-strong-password>
ADMIN_REGISTRATION_CODE=<generate-random-code>
CORS_ORIGIN=http://localhost:3000

# Client
VITE_API_URL=http://localhost:5000/api
```

---

*End of Review Document*
