# Architecture Overview

> High-level system architecture for the offline-first Pharmacy POS.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         PHARMACY PREMISES                               │
│                                                                         │
│  ┌──────────────────────┐     ┌──────────────────────┐                  │
│  │   POS Terminal A     │     │   POS Terminal B     │                  │
│  │   (Front Counter)    │     │   (Drive-through)    │                  │
│  │                      │     │                      │                  │
│  │  ┌────────────────┐  │     │  ┌────────────────┐  │                  │
│  │  │   IndexedDB    │  │     │  │   IndexedDB    │  │                  │
│  │  │  (all data)    │  │     │  │  (all data)    │  │                  │
│  │  └───────┬────────┘  │     │  └───────┬────────┘  │                  │
│  │          │           │     │          │           │                  │
│  │  ┌───────┴────────┐  │     │  ┌───────┴────────┐  │                  │
│  │  │  Sync Engine   │  │     │  │  Sync Engine   │  │                  │
│  │  │  (every 60s)   │  │     │  │  (every 60s)   │  │                  │
│  └───────┬───────────┘  │     └───────┬───────────┘  │                  │
│          │              │             │              │                  │
│          └──────────────┼─────────────┘              │                  │
│                         │  HTTP (local network)      │                  │
│                         ▼                            │                  │
│              ┌─────────────────────┐                  │                  │
│              │   Express Relay     │                  │                  │
│              │   (Local Server)    │                  │                  │
│              │                     │                  │                  │
│              │  ┌───────────────┐  │                  │                  │
│              │  │    SQLite     │  │  ┌────────────┐  │                  │
│              │  │  (relay cache)│  │  │  Cloud Sync │  │                  │
│              │  └───────┬───────┘  │  │  (every 5m) │  │                  │
│              └──────────┼──────────┘  └──────┬───────┘  │                  │
│                         │                     │          │                  │
└─────────────────────────┼─────────────────────┼──────────┘                  │
                          │                     │                              │
                          │  Local Network      │  Internet (HTTPS)            │
                          ▼                     ▼                              │
              ┌─────────────────────────────────────────────┐                  │
              │              CLOUD DATABASE                  │                  │
              │         (Central Backup / Aggregation)       │                  │
              │                                              │                  │
              │  • Stores data from all pharmacy locations    │                  │
              │  • No live dependency for operations          │                  │
              │  • Analytics / remote monitoring              │                  │
              └──────────────────────────────────────────────┘                  │
                                                                               │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
│                                                                             │
│  OPERATION                    PATH                           LATENCY        │
│  ───────────────────────────────────────────────────────────────────        │
│  Search products     IndexedDB ──► UI                        <5ms          │
│  Process sale        IndexedDB ──► UI (instant)              <50ms          │
│  View reports        IndexedDB ──► UI                        <10ms          │
│  Sync push (POS→R)   IndexedDB ──► Express ──► SQLite       ~100ms          │
│  Sync pull (R→POS)   SQLite ──► Express ──► IndexedDB       ~200ms          │
│  Cloud push (R→C)    SQLite ──► Express ──► Cloud DB        1-5s (async)   │
│  Cloud pull (C→R)    Cloud DB ──► Express ──► SQLite        1-5s (async)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Map

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         REACT APP (client/)                                │
│                                                                           │
│  ┌────────────────────┐   ┌────────────────────┐                          │
│  │      PAGES         │   │     COMPONENTS      │                         │
│  │  ┌──────────────┐  │   │  ┌───────────────┐  │                         │
│  │  │ Login        │  │   │  │ ui/ (shadcn)  │  │  7 primitive components │
│  │  │ Register     │  │   │  │ Navbar        │  │  Layout + sync status  │
│  │  │ POS          │  │   │  │ Sidebar       │  │  Navigation + printer  │
│  │  │ Sales        │  │   │  │ Toast         │  │  Notifications        │
│  │  │ Inventory    │  │   │  │ SyncStatusBar │  │  Sync status banner   │
│  │  │ Reports      │  │   │  │ ConnectInd.   │  │  Relay connection     │
│  │  │ AdminDash    │  │   │  └───────────────┘  │                         │
│  │  │ SalesRepDash │  │   └────────────────────┘                          │
│  │  │ Profile      │  │                                                    │
│  │  └──────────────┘  │                                                    │
│  └────────────────────┘                                                    │
│                                                                           │
│  ┌────────────────────┐   ┌────────────────────┐                          │
│  │     STORES         │   │      HOOKS          │                         │
│  │  ┌──────────────┐  │   │  ┌───────────────┐  │                         │
│  │  │ authStore    │  │   │  │ useAuth       │  │  Local PIN verification │
│  │  │ cartStore    │  │   │  │ useProducts   │  │  Local repo wrapper    │
│  │  └──────────────┘  │   │  │ useSales      │  │  Local repo wrapper    │
│  │                    │   │  │ useReports    │  │  Dexie aggregations    │
│  │                    │   │  │ useSync       │  │  Sync lifecycle       │
│  │                    │   │  │ useSyncStatus │  │  Sync state hook      │
│  │                    │   │  │ usePrinter    │  │  Printer state hook   │
│  │                    │   │  └───────────────┘  │                         │
│  └────────────────────┘   └────────────────────┘                          │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────┐            │
│  │                     SERVICES                               │            │
│  │  ┌─────────────────┐  ┌─────────────────┐                │            │
│  │  │  syncService    │  │  printerService  │                │            │
│  │  │  • Push/pull    │  │  • WebUSB connect │               │            │
│  │  │  • Conflict res.│  │  • ESC/POS builder │              │            │
│  │  │  • Retry/backoff│  │  • Print queue    │               │            │
│  │  └────────┬────────┘  └─────────────────┘                │            │
│  └───────────┼──────────────────────────────────────────────┘            │
│              │                                                           │
│  ┌───────────┴──────────────────────────────────────────────┐            │
│  │                     DATA LAYER                           │            │
│  │  ┌─────────────────────────────────────────────────────┐ │            │
│  │  │  db/                                                 │ │            │
│  │  │    index.ts    — Dexie initialization + schema v2    │ │            │
│  │  │    repository.ts — All CRUD (always local)           │ │            │
│  │  │    sync.ts       — Sync engine helper                │ │            │
│  │  │    seed.ts       — First-launch demo data            │ │            │
│  │  │                                                     │ │            │
│  │  │  Tables: products, sales, users, syncQueue,         │ │            │
│  │  │          syncMeta, printJobs, storeInfo,            │ │            │
│  │  │          stockAdjustments                           │ │            │
│  │  └─────────────────────────────────────────────────────┘ │            │
│  └──────────────────────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER (server/)                          │
│                                                                           │
│  ┌────────────────────┐   ┌─────────────────────┐                        │
│  │     ROUTES         │   │      SERVICES        │                        │
│  │  ┌──────────────┐  │   │  ┌────────────────┐  │                        │
│  │  │ /auth/*      │  │   │  │ cloudSync      │  │  Background engine    │
│  │  │ /sync/*      │  │   │  │ • Push to cloud │  │  Periodically pushes │
│  │  │ /inventory/* │  │   │  │ • Pull from cloud│  │  SQLite → Cloud DB  │
│  │  │ /sales/*     │  │   │  │ • Retry/backoff │  │  and vice versa      │
│  │  │ /users/*     │  │   │  └────────────────┘  │                        │
│  │  └──────────────┘  │   └─────────────────────┘                        │
│  └────────────────────┘                                                   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────┐                 │
│  │                    DATA LAYER                         │                 │
│  │  ┌────────────────────────────────────────────────┐  │                 │
│  │  │  SQLite (via Sequelize)                         │  │                 │
│  │  │  ┌──────────────────┐  ┌────────────────────┐  │  │                 │
│  │  │  │ Existing tables  │  │ Relay tables (new)  │  │  │                 │
│  │  │  │ • users          │  │ • relay_products    │  │  │                 │
│  │  │  │ • products       │  │ • relay_sales       │  │  │                 │
│  │  │  │ • sales          │  │ • relay_users       │  │  │                 │
│  │  │  │                  │  │ • sync_push_log     │  │  │                 │
│  │  │  │                  │  │ • sync_pull_log     │  │  │                 │
│  │  │  │                  │  │ • devices           │  │  │                 │
│  │  │  │                  │  │ • cloud_sync_meta   │  │  │                 │
│  │  │  └──────────────────┘  └────────────────────┘  │  │                 │
│  │  └────────────────────────────────────────────────┘  │                 │
│  └──────────────────────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Timing

```
POS ─────────────► Express Relay ─────────────► Cloud DB
│                       │                            │
│  [every 60s]          │  [every 5 min]              │
│  POST /api/sync/push  │  Push: relay_* where       │
│  Batch local changes  │  synced_to_cloud = false    │
│                       │                            │
│  [every 120s]         │  [every 5 min]              │
│  GET /api/sync/pull   │  Pull: GET /api/cloud/sync  │
│  Fetch others' changes│  Apply to relay tables      │
│                       │                            │
│  [on online event]    │  [on force endpoint]        │
│  Immediate sync       │  POST /api/sync/force       │
└───────────────────────┴────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **IndexedDB as primary store** | Works offline, survives browser close, structured queries via Dexie |
| **Express as relay, not API** | POS never depends on server. Server is a sync buffer, not a gatekeeper. |
| **Local PIN auth** | No JWT, no network call to log in. SHA-256 hashed PIN stored in IndexedDB. |
| **Last-write-wins conflicts** | Simple, predictable. Adequate for single-pharmacy with admin authority. |
| **Dexie transactions for sales** | Stock deduct + sale create in one atomic operation. No partial sales. |
| **WebUSB for printing** | Direct ESC/POS to thermal printer. No Electron wrapper needed. |
| **Cloud sync every 5 min** | Frequent enough for backup. Sparse enough to not burden low-bandwidth connections. |
| **SQLite as relay buffer** | Server stores sync data even if cloud is down. POS can push without cloud being reachable. |

---

## Document Reference

| Document | Location | Covers |
|----------|----------|--------|
| Architecture Overview | `docs/ARCHITECTURE_OVERVIEW.md` | This file — high-level system map |
| User Flow | `client/docs/USER_FLOW.md` | Screen-by-screen user journeys, roles, routes |
| Design System | `client/docs/DESIGN_SYSTEM.md` | Colors, typography, components, spacing, motion |
| Offline Architecture | `client/docs/OFFLINE_ARCHITECTURE.md` | Detailed offline-first data layer, sync engine, auth, printing |
| Sync Relay | `server/docs/SYNC_RELAY.md` | Express sync endpoints, SQLite schema, cloud sync engine |
| Implementation Roadmap | `client/docs/IMPLEMENTATION_ROADMAP.md` | Phased build plan with file-level change list |
