# Pharmacy POS

An offline-first point-of-sale system built for pharmacies. Runs entirely in the browser with IndexedDB, syncs to a local relay server when available.

## Features

- **Offline-first** — All data stored in IndexedDB. Works without internet.
- **POS Terminal** — Fast product search, cart management, quantity controls, hold/recall sales.
- **Inventory Management** — Stock tracking, expiry monitoring, low-stock alerts, CSV bulk import.
- **Multi-user** — Admin and sales rep roles with PIN-based auth. First-login PIN change for new reps.
- **Reporting** — Sales trends, top products, inventory valuation, activity logs.
- **Settings** — Store info, tax config, receipt template, backup/restore, periodic sync.
- **Sync** — Push/pull to a local relay server. Export/import JSON backups.
- **Receipt Printing** — ESC/POS thermal printer support via WebUSB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS v4 |
| State | Zustand (with persist) |
| Database | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Relay Server | Node.js, Express, SQLite (Sequelize) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Client

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Relay Server (optional)

```bash
cd server
npm install
npm run dev
```

Runs at `http://localhost:5000`. Used for multi-device sync and backup.

## Project Structure

```
POS/
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # shadcn primitives (button, card, dialog, etc.)
│   │   │   ├── inventory/   # Inventory-specific components
│   │   │   ├── dashboard/   # Dashboard widgets
│   │   │   ├── reports/     # Report shared components
│   │   │   └── settings/    # Settings tab components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand stores
│   │   ├── db/              # Dexie DB, repositories, seed
│   │   ├── services/        # Sync service, printer service
│   │   ├── lib/             # Utilities (currency, trend builder, etc.)
│   │   └── types/           # TypeScript types
│   └── docs/                # Architecture, design system docs
│
└── server/
    └── src/
        ├── models/          # Sequelize models (User, Product, Sale, Device)
        ├── routes/          # Express routes (sync, auth)
        ├── config/          # Database config, sync config
        └── server.js        # Entry point
```

## User Roles

| Capability | Sales Rep | Admin |
|------------|:---------:|:-----:|
| Process sales | ✓ | ✓ |
| View own sales history | ✓ | ✓ |
| View all sales history | - | ✓ |
| Manage inventory | - | ✓ |
| Bulk import products (CSV) | - | ✓ |
| Manage users | - | ✓ |
| View reports | - | ✓ |
| Configure settings | - | ✓ |
| Backup/restore data | - | ✓ |

## Default Credentials

| Role | Email | PIN |
|------|-------|-----|
| Admin | admin@pharmacy.com | 12345 |
| Sales Rep | john@pharmacy.com | 56789 |

## Architecture

```
POS Terminal (Browser)
  ├── IndexedDB (Dexie) — all local data
  ├── Sync Service — push/pull queue
  └── Relay Server (Express) — SQLite buffer for multi-device sync
```

- All operations read/write directly to IndexedDB — no server dependency.
- Sync queue batches changes and pushes to the relay when online.
- Relay stores changes in SQLite and broadcasts to other devices.
- Last-write-wins conflict resolution.

## License

ISC
