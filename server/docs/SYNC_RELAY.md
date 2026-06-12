# Express Sync Relay

> The Express server transitions from primary data source to local sync relay between POS terminals and the cloud.

---

## 1. Role Change

### Before (current)
```
POS → Express (API) → SQLite (primary DB)
```

The Express server was the single source of truth. Every operation required it. If it was down, the POS was crippled.

### After (new)
```
POS → IndexedDB (always) → Express (relay) → SQLite (cache) → Cloud (backup)
```

The Express server is a pass-through. It receives sync data, stores it temporarily, and relays it to the cloud. The POS works perfectly without it.

---

## 2. New Responsibilities

| Responsibility | Priority | Description |
|----------------|----------|-------------|
| Sync push receiver | Critical | Accept batched changes from POS terminals, store in SQLite |
| Sync pull server | Critical | Serve pending changes to POS terminals since their last pull |
| Device registration | High | Issue device tokens for POS terminals on first sync |
| Cloud sync engine | High | Periodically push SQLite changes to cloud, pull cloud changes down |
| Auth relay | Medium | On first sync, validate admin credentials against cloud (optional) |
| Print server | Low | Optional: serve print jobs to network-connected printers (future) |

---

## 3. New API Endpoints

```
POST   /api/sync/push           — Receive batch of changes from POS
GET    /api/sync/pull           — Serve changes since timestamp
POST   /api/sync/register       — Register a new device
GET    /api/sync/status         — Check sync status (pending push/pull counts)
POST   /api/sync/force          — Trigger immediate cloud sync
```

### 3.1 POST /api/sync/push

```
Request:
{
  "deviceId": "pos-abc123",
  "batch": [
    {
      "table": "products",
      "action": "update",       // create | update | delete
      "recordId": 42,
      "data": { "price": 6.99, "stock_quantity": 50 },
      "deviceId": "pos-abc123",
      "timestamp": 1718112345000
    },
    {
      "table": "sales",
      "action": "create",
      "data": { "product_id": 42, "quantity": 2, "total_price": 13.98 },
      "deviceId": "pos-abc123",
      "timestamp": 1718112346000
    }
  ]
}

Response 200:
{
  "accepted": 2,
  "rejected": 0,
  "errors": [],
  "serverTimestamp": 1718112347000
}

Response 207 (partial failure):
{
  "accepted": 1,
  "rejected": 1,
  "errors": [{ "index": 1, "reason": "Invalid product reference" }],
  "serverTimestamp": 1718112347000
}
```

Processing logic:
```
for each item in batch:
  if table not in allowed_tables → reject
  if action is create → INSERT INTO relay_{table}
  if action is update → UPSERT relay_{table} WHERE recordId AND deviceId
  if action is delete → soft delete (mark deleted_at)
  if action is create and recordId exists → UPSERT (deviceId scoped)
  
  always set:
    relay_{table}.synced_to_cloud = false
    relay_{table}.received_at = server timestamp
```

### 3.2 GET /api/sync/pull

```
Request:
  GET /api/sync/pull?since=1718112347000&deviceId=pos-abc123

Response 200:
{
  "changes": {
    "products": [
      {
        "id": 15,
        "data": { "name": "Aspirin", "price": 4.50, "stock_quantity": 100 },
        "updatedAt": 1718112300000,
        "deviceId": "pos-terminal-02"
      }
    ],
    "sales": [],
    "users": [
      {
        "id": 3,
        "data": { "name": "Jane", "email": "jane@pharmacy.com", "role": "sales" },
        "updatedAt": 1718112200000,
        "deviceId": "pos-terminal-01"
      }
    ],
    "storeInfo": {
      "storeName": "Pharmacy POS",
      "taxRate": 10,
      "currency": "GHS"
    }
  },
  "serverTimestamp": 1718112350000
}
```

Processing logic:
```
for each relay table:
  query: SELECT * FROM relay_{table}
         WHERE updatedAt > since
         AND (deviceId != requestingDeviceId OR synced_to_device IS NULL)
  
  limit: 500 items per table per pull (paginate with since)
  order: updatedAt ASC (oldest changes first)
  
  if deviceId matches requestingDeviceId:
    mark synced_to_device = true (device already has its own changes)
  else:
    include in response (changes from other devices)

special: storeInfo is always included (small, global config)
```

### 3.3 POST /api/sync/register

```
Request:
{
  "deviceName": "Front Counter POS",
  "deviceType": "pos-terminal",
  "adminEmail": "admin@pharmacy.com",
  "adminPin": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
}

Response 200:
{
  "deviceId": "pos-abc123",
  "deviceToken": "tok_abc123...",
  "serverConfig": {
    "storeName": "Pharmacy POS",
    "taxRate": 10,
    "currency": "GHS"
  },
  "initialSince": 1718112350000  // POS uses this for first full pull
}
```

---

## 4. SQLite Schema Changes

### New Relay Tables

```sql
-- One relay table per entity type, mirroring the app schema
-- with added sync metadata fields

CREATE TABLE relay_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,           -- original ID from POS device
  device_id TEXT NOT NULL,              -- which POS created/updated this
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock_quantity INTEGER DEFAULT 0,
  expiry_date TEXT,
  barcode TEXT,
  min_stock INTEGER DEFAULT 10,
  supplier TEXT,
  updated_at INTEGER NOT NULL,          -- UNIX timestamp from POS
  received_at INTEGER NOT NULL,         -- server receipt timestamp
  synced_to_cloud INTEGER DEFAULT 0,    -- 0 = pending, 1 = done
  synced_to_device INTEGER DEFAULT 0,   -- 0 = not yet sent to other POS
  deleted_at INTEGER,                   -- soft delete
  UNIQUE(record_id, device_id)          -- scoped per device
);

CREATE TABLE relay_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  user_id INTEGER,
  items TEXT,                           -- JSON string of cart snapshot
  total_price REAL,
  tax REAL,
  grand_total REAL,
  payment_method TEXT,
  amount_tendered REAL,
  change_due REAL,
  date TEXT,
  updated_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  synced_to_cloud INTEGER DEFAULT 0,
  synced_to_device INTEGER DEFAULT 0,
  deleted_at INTEGER,
  UNIQUE(record_id, device_id)
);

CREATE TABLE relay_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'sales',
  pin_hash TEXT,                        -- stored for local auth (device scoped)
  is_active INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  synced_to_cloud INTEGER DEFAULT 0,
  synced_to_device INTEGER DEFAULT 0,
  deleted_at INTEGER,
  UNIQUE(record_id, device_id)
);
```

### New Sync Management Tables

```sql
CREATE TABLE sync_push_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  accepted INTEGER NOT NULL,
  rejected INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE sync_pull_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  since INTEGER NOT NULL,
  changes_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_type TEXT DEFAULT 'pos-terminal',
  token TEXT,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE cloud_sync_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT UNIQUE NOT NULL,
  last_pushed_at INTEGER,
  last_pulled_at INTEGER,
  push_count INTEGER DEFAULT 0,
  pull_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

### Migration

```sql
-- Existing tables remain untouched
-- Relational DB keeps: users, products, sales (from existing schema)
-- New relay tables are the sync buffer

-- Migration: adds sync tables without modifying existing schema
ALTER TABLE products ADD COLUMN device_id TEXT;
ALTER TABLE products ADD COLUMN synced_at INTEGER;
ALTER TABLE products ADD COLUMN sync_status TEXT DEFAULT 'pending';

ALTER TABLE sales ADD COLUMN device_id TEXT;
ALTER TABLE sales ADD COLUMN synced_at INTEGER;
ALTER TABLE sales ADD COLUMN sync_status TEXT DEFAULT 'pending';

ALTER TABLE users ADD COLUMN device_id TEXT;
ALTER TABLE users ADD COLUMN synced_at INTEGER;
ALTER TABLE users ADD COLUMN sync_status TEXT DEFAULT 'pending';
```

---

## 5. Cloud Sync Engine

```
┌─────────────────────────────────────────────┐
│          Cloud Sync Engine                   │
│                                             │
│  Timer: runs every 5 minutes                │
│  ─────────────────────────────────           │
│                                             │
│  1. PUSH:                                    │
│     Query all relay tables for               │
│       synced_to_cloud = 0                    │
│     Batch into groups of 100                 │
│     POST to cloud endpoint                   │
│     On success: mark synced_to_cloud = 1     │
│     On failure: retry up to 3 times          │
│       with exponential backoff (5s, 25s, 125s)│
│                                             │
│  2. PULL:                                    │
│     GET from cloud endpoint                  │
│       /api/cloud/sync?since={lastPulledAt}   │
│     Apply changes to relay tables            │
│       (insert/update with cloud's deviceId)  │
│     Update cloud_sync_meta.last_pulled_at    │
│                                             │
│  3. LOG:                                     │
│     Record push/pull counts, errors          │
│     Update cloud_sync_meta for each table    │
└─────────────────────────────────────────────┘
```

### Cloud API Endpoints (target)

```
POST   /api/cloud/sync/push    — Express pushes batch to cloud
GET    /api/cloud/sync/pull    — Express pulls changes from cloud
POST   /api/cloud/register    — Register this pharmacy/server
```

---

## 6. Configuration

```typescript
// server/src/config/sync.ts

export const syncConfig = {
  // Local sync (POS ↔ Express)
  local: {
    port: 5000,
    maxBatchSize: 100,
    defaultSince: 0,
  },

  // Cloud sync (Express ↔ Cloud)
  cloud: {
    enabled: true,
    endpoint: process.env.CLOUD_SYNC_URL || 'https://api.pharmacypos.com',
    apiKey: process.env.CLOUD_API_KEY,
    intervalMs: 5 * 60 * 1000,          // 5 minutes
    retryMaxAttempts: 3,
    retryBaseDelayMs: 5000,              // 5s → 25s → 125s
    batchSize: 100,
  },

  // Allowed tables for sync
  allowedTables: ['products', 'sales', 'users', 'storeInfo'] as const,
};
```

---

## 7. What Is Maintained (server)

| Area | Files | Why |
|------|-------|-----|
| Auth routes | `routes/auth.ts` | Still used for initial device registration + PIN verification relay (optional) |
| Product routes | `routes/inventory.ts` | Still functional for direct API access (admin tools, testing) |
| Sales routes | `routes/sales.ts` | Same — backward compatibility |
| User routes | `routes/users.ts` | Same — backward compatibility |
| Database models | `models/` | Sequelize models unchanged |
| Existing migrations | `db/migrations/` | Unchanged — new migrations add to schema |
| CORS, middleware, error handling | `middleware/` | Unchanged |
| JWT auth middleware | `middleware/auth.ts` | Still used for admin cloud auth |

---

## 8. What Changes (server)

| Area | Files | What |
|------|-------|------|
| New routes | `src/routes/sync.ts` | POST /push, GET /pull, POST /register, GET /status, POST /force |
| New service | `src/services/cloudSync.ts` | Background engine — push to cloud, pull from cloud, retry with backoff |
| New migrations | `src/db/migrations/002_sync_tables.ts` | relay_products, relay_sales, relay_users, sync_push_log, sync_pull_log, devices, cloud_sync_meta |
| Server entry | `src/index.ts` | Add sync route mount, start cloud sync engine on boot |
| Sync config | `src/config/sync.ts` | Configuration object for batch sizes, intervals, endpoints |
| Dependencies | `package.json` | Add `node-fetch` or `axios` for cloud HTTP calls |
| Environment | `.env` | Add `CLOUD_SYNC_URL`, `CLOUD_API_KEY` |

---

## 9. Development & Testing

```
────────────────────────────────────────────────────────────
LOCAL DEV SETUP
────────────────────────────────────────────────────────────

  1. Start Express server (sync relay mode):
     npm run dev       # Runs on localhost:5000

  2. Start POS client:
     npm run dev       # Runs on localhost:3000
                        # Sync engine targets localhost:5000

  3. Both on same machine → POS syncs to Express via localhost
     No cloud connection needed for development

────────────────────────────────────────────────────────────
TESTING SYNC
────────────────────────────────────────────────────────────

  # Simulate POS pushing changes:
  curl -X POST http://localhost:5000/api/sync/push \
    -H "Content-Type: application/json" \
    -d '{
      "deviceId": "test-pos",
      "batch": [{
        "table": "products",
        "action": "create",
        "data": { "name": "Test Product", "price": 9.99, "stock_quantity": 10 },
        "deviceId": "test-pos",
        "timestamp": 1718112345000
      }]
    }'

  # Pull changes:
  curl "http://localhost:5000/api/sync/pull?since=0&deviceId=test-pos-2"

  # Check sync status:
  curl http://localhost:5000/api/sync/status

────────────────────────────────────────────────────────────
TESTING CLOUD SYNC
────────────────────────────────────────────────────────────

  # Set CLOUD_SYNC_URL to a local test endpoint
  # or mock the cloud service with a simple HTTP server
  # Trigger immediate sync:
  curl -X POST http://localhost:5000/api/sync/force
```

---

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| POS pushes while Express is down | POS retries on next sync cycle (60s). Data persists in IndexedDB. No data loss. |
| Express cloud sync fails | Retry 3 times with exponential backoff. Log error. Continue accepting POS pushes. |
| Duplicate push from POS | Relay UPSERT (deviceId + recordId unique constraint). Idempotent. |
| Conflicting edits from 2 POS devices | Last-write-wins by `updated_at` timestamp. Both records preserved in relay table. |
| Cloud endpoint unreachable | Engine backs off. Marks sync as degraded. POS sync is unaffected (local relay works). |
| Relay table full | No hard limit — SQLite handles millions of rows. Old synced records archived periodically. |

---

## 11. Project File Map

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.ts          ← Maintained (device registration)
│   │   ├── inventory.ts     ← Maintained (backward compatible)
│   │   ├── sales.ts         ← Maintained (backward compatible)
│   │   ├── users.ts         ← Maintained (backward compatible)
│   │   └── sync.ts          ← NEW: push, pull, register, status, force
│   │
│   ├── services/
│   │   └── cloudSync.ts     ← NEW: background cloud sync engine
│   │
│   ├── config/
│   │   └── sync.ts          ← NEW: sync configuration
│   │
│   ├── db/
│   │   ├── index.ts         ← Modified: run new migration
│   │   └── migrations/
│   │       ├── 001_init.ts  ← Maintained
│   │       └── 002_sync.ts  ← NEW: relay tables + sync metadata tables
│   │
│   ├── middleware/
│   │   └── auth.ts          ← Maintained
│   │
│   ├── types/
│   │   └── sync.ts          ← NEW: sync request/response types
│   │
│   └── index.ts             ← Modified: mount sync routes, start cloudSync
│
├── .env                     ← Modified: add CLOUD_SYNC_URL, CLOUD_API_KEY
├── package.json             ← Modified: add axios or node-fetch
└── docs/
    └── SYNC_RELAY.md        ← This document
```
