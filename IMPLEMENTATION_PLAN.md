# Implementation Plan — Pharmacy POS System

> **Goal**: Transform the current prototype into a production-ready, offline-first POS system  
> **Total estimated effort**: 15–20 days (single developer)  
> **Phases**: 6 sequential phases, each with discrete deliverables

---

## How to Use This Plan

Each phase has:
- **Objective** — what you'll accomplish
- **Prerequisites** — what must be done first
- **Tasks** — numbered steps, do them in order
- **Verification** — how to confirm it worked
- **Rollback** — how to undo if something breaks
- **Expected outcome** — what success looks like

**Before starting any phase**: commit or stash all current work so you can roll back.

```bash
git add -A && git commit -m "checkpoint: before phase N"
```

---

## Phase 0: Preparation & Safety Net

**Objective**: Create a safe working environment with backups and baseline knowledge.

**Effort**: 30 min

### Tasks

| # | Task | Command / Instruction | Expected |
|---|---|---|---|
| 0.1 | Verify current git status | `git status` | Clean working tree |
| 0.2 | Create a branch for the work | `git checkout -b refactor/phase-1-fixes` | New branch created |
| 0.3 | Commit current state as a baseline | `git add -A && git commit -m "baseline: current prototype state"` | All files committed |
| 0.4 | Install server dependencies | `cd server && npm install` | No errors |
| 0.5 | Install client dependencies | `cd client && npm install` | No errors |
| 0.6 | Test that the app starts | Start server + client, visit localhost:3000 | Login page renders |

### Verification

```bash
# Start server (from project root)
cd server && npm run dev

# In another terminal
cd client && npm run dev

# Open http://localhost:3000 — you should see the login page
```

### Rollback

```bash
git checkout main
```

---

## Phase 1: Critical Bug Fixes ✅

**Objective**: Fix blockers that make the app unusable or dangerous in production.

**Effort**: 1 day ✅  
**Status**: Complete  
**Dependencies**: Phase 0 complete

### Task 1.1 — Make Database Persistent

**File**: `server/src/config/database.js`

**What**: Change SQLite from `:memory:` to a persistent file.

**Instructions**:
1. Create a `data/` directory inside `server/`
2. Update `database.js`:
   - Change `storage: ':memory:'` to `storage: './data/pos.db'`
   - Add `storage` to the Sequelize config
3. Add `data/` to `.gitignore` (so development data isn't committed)

**Code change**:
```js
// BEFORE
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

// AFTER
const path = require('path');
const fs = require('fs');
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dbDir, 'pos.db'),
    logging: false
});
```

**Verification**:
1. Start server, login, create a product + sale
2. Stop server (Ctrl+C)
3. Start server again
4. Login and verify the product and sale still exist
5. Verify `server/data/pos.db` file exists

---

### Task 1.2 — Add Sequelize Model Associations

**File**: `server/src/models/sale.js`, `server/src/models/user.js`, `server/src/models/product.js`

**What**: Add `belongsTo` / `hasMany` relationships so queries can join tables.

**Instructions**:
1. Add associations in each model file using `Model.associate()` or at the bottom of each file
2. In `server/src/server.js`, after model sync, call the association setup

**Code additions**:

In `server/src/models/product.js`, add at bottom:
```js
Product.associate = (models) => {
    Product.hasMany(models.Sale, { foreignKey: 'product_id' });
};
```

In `server/src/models/user.js`, add at bottom:
```js
User.associate = (models) => {
    User.hasMany(models.Sale, { foreignKey: 'user_id' });
};
```

In `server/src/models/sale.js`, add at bottom:
```js
Sale.associate = (models) => {
    Sale.belongsTo(models.Product, { foreignKey: 'product_id' });
    Sale.belongsTo(models.User, { foreignKey: 'user_id' });
};
```

In `server/src/server.js`, after `sequelize.sync()`:
```js
const models = { User, Product, Sale };
Object.values(models).forEach(model => {
    if (model.associate) model.associate(models);
});
```

**Verification**: Start server — no errors on sync. Data persists.

---

### Task 1.3 — Add `user_id` to Sales Model

**File**: `server/src/models/sale.js`

**What**: Track which user made each sale. Required for sales rep attribution.

**Instructions**:
1. Add `user_id` field to the Sale model definition
2. Requires a database reset (delete `server/data/pos.db` if it exists)
3. Update `salesController.js` to accept and set `user_id`

**Code change** in `sale.js`:
```js
const Sale = sequelize.define('Sale', {
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
```

In `salesController.js`, update `createSale`:
```js
exports.createSale = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        // ... validation ...

        const total_price = product.price * quantity;

        const sale = await Sale.create({
            product_id,
            user_id: req.userId,    // <-- ADD THIS
            quantity,
            total_price
        });

        await product.update({ stock_quantity: product.stock_quantity - quantity });
        res.status(201).json({ message: 'Sale created successfully', sale });
    } catch (error) {
        res.status(500).json({ message: 'Error creating sale', error: error.message });
    }
};
```

**Verification**: Create a sale, then check the database — sale should have a `user_id` matching the logged-in user.

---

### Task 1.4 — Wrap Sale Creation in a Transaction

**File**: `server/src/controllers/salesController.js`

**What**: Prevent data corruption if the server crashes between creating a sale and deducting stock.

**Instructions**:
1. Use `sequelize.transaction()` to wrap both the Sale.create and product.update calls
2. If either fails, both are rolled back

**Code change**:
```js
const { sequelize } = require('../config/database'); // export sequelize from config

exports.createSale = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        const result = await sequelize.transaction(async (t) => {
            const product = await Product.findByPk(product_id, { transaction: t });
            if (!product) throw new Error('Product not found');
            if (product.stock_quantity < quantity) throw new Error('Insufficient stock');

            const total_price = parseFloat(product.price) * quantity;
            const sale = await Sale.create({
                product_id, user_id: req.userId, quantity, total_price
            }, { transaction: t });

            await product.update({
                stock_quantity: product.stock_quantity - quantity
            }, { transaction: t });

            return sale;
        });

        res.status(201).json({ message: 'Sale created successfully', sale: result });
    } catch (error) {
        res.status(500).json({ message: 'Error creating sale', error: error.message });
    }
};
```

Also export `sequelize` from `database.js`:
```js
// At the bottom of database.js
module.exports = sequelize;
module.exports.sequelize = sequelize;   // <-- ADD for named import
```

**Verification**: Create a sale — it should work exactly as before, but now it's atomic. To test, intentionally throw an error between the two operations and verify no partial data remains.

---

### Task 1.5 — Fix Vite Proxy Rewrite Bug

**File**: `client/vite.config.js`

**What**: The proxy rewrite strips `/api` but the backend routes expect `/api`. Remove the rewrite line.

**Before**:
```js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')  // <-- this is the bug
  }
}
```

**After**:
```js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

**Note**: This only affects the Vite dev proxy. In production, the Axios instance calls `http://localhost:5000/api` directly.

---

### Task 1.6 — Create Actual `.env` Files

**Files**: `server/.env`, `client/.env`

**What**: Copy `.env.example` to `.env` with working defaults for development.

**Server `.env`**:
```
PORT=5000
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
```

**Client `.env`**:
```
VITE_API_URL=http://localhost:5000/api
```

Also add `JWT_SECRET` fallback in `server/src/server.js` for when `.env` is missing:
```js
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    process.exit(1);
}
```

---

### Task 1.7 — Remove Dead Code

**Files to delete or modify**:

| File | Action |
|---|---|
| `client/src/pages/Dashboard.jsx` | Delete the file |
| `client/src/App.jsx:7` | Remove `import Dashboard from './pages/Dashboard'` |
| `inventoryController.js:89-95` | Delete `getProducts()` and `addProduct()` |
| `salesController.js:73-79` | Delete `getSales()` and `processSale()` |
| `reportController.js:87-93` | Delete `generateSalesReport()` and `generateInventoryReport()` |
| `SETUP_DATABASE.sql` | Delete |
| `setup.sql` | Delete |
| `csv-parser` from `server/package.json` | Run `npm uninstall csv-parser` |
| `multer` from `server/package.json` | Run `npm uninstall multer` |

**Commands**:
```bash
rm "client/src/pages/Dashboard.jsx"
rm SETUP_DATABASE.sql setup.sql
cd server && npm uninstall csv-parser multer
```

**Verification**: App starts and runs without errors. All pages render correctly.

---

### Task 1.8 — Remove Redundant Authorization Headers

**Files**: All pages that manually attach `Authorization` headers (Sales, Inventory, AdminDashboard, SalesRepDashboard, Reports)

**What**: The Axios interceptor in `api.js` already adds the `Bearer` token from localStorage. The manual headers are redundant but harmless. Remove them for cleanup.

Search for the pattern:
```js
headers: { Authorization: `Bearer ${token}` }
```

In each file:
1. Remove the `const token = localStorage.getItem('token')` line at the top of each fetch function (if the token is only used for headers)
2. Remove the `headers` property from the API call

**Verification**: All pages still fetch data correctly.

---

### Phase 1 Verification Checklist

```bash
# 1. Start the app
cd server && npm run dev &
cd client && npm run dev &

# 2. Login as admin@pharmacy.com / admin@123
# 3. Create 3 products
# 4. Create a sale
# 5. Restart the server (Ctrl+C, restart)
# 6. Verify: products and sales still exist
# 7. Verify: Dashboard shows correct stats
# 8. Verify: Reports page loads without errors
# 9. Verify: No "Loading..." text stuck on any page
```

### Rollback for Phase 1

```bash
git checkout refactor/phase-1-fixes  # if committed
# OR
git checkout main  # full rollback to baseline
```

---

## Phase 2: UX & Data Quality Improvements ✅

**Objective**: Make the app usable, informative, and reliable.

**Effort**: 2 days ✅  
**Status**: Complete  
**Dependencies**: Phase 1 complete

### Task 2.1 — Add Product Search on Sales Page

**File**: `client/src/pages/Sales.jsx`

**What**: Add a search input that filters the product grid in real-time.

**Instructions**:
1. Add `const [search, setSearch] = useState('')`
2. Add a text input above the product grid
3. Filter products: `products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))`
4. Add category filter dropdown

**Add after `if (loading) return ...`** (approx line 73):
```jsx
<div className="sales-filters">
  <input
    type="text"
    placeholder="Search products..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
    autoFocus
  />
  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="category-filter"
  >
    <option value="">All Categories</option>
    {[...new Set(products.map(p => p.category))].map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

Replace `{products.map(product => ...)}` with:
```jsx
{products
  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  .filter(p => !categoryFilter || p.category === categoryFilter)
  .map(product => (...existing code...))
}
```

Add basic styles in `Sales.css`:
```css
.sales-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.category-filter {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}
```

---

### Task 2.2 — Show Product Names in Reports

**File**: `client/src/pages/Reports.jsx`

**What**: Instead of showing `product_id` numbers, show product names by joining with the products data.

**Instructions**:
1. Fetch products list once alongside reports data
2. Create a lookup map: `const productMap = new Map(products.map(p => [p.id, p.name]))`
3. In the report tables, replace `{sale.product_id}` with `{productMap.get(sale.product_id) || 'Unknown'}`

**In `fetchReports`**, add:
```js
const productsRes = await API.get('/inventory', { ... });
const products = productsRes.data.products || [];
const productMap = new Map(products.map(p => [p.id, p.name]));
```

Store `productMap` in state and use it when rendering sale rows:
```jsx
<td>{productMap.get(sale.product_id) || `Product #${sale.product_id}`}</td>
```

Also add product name to Top Products:
```jsx
<td>{productMap.get(product.product_id) || `Product #${product.product_id}`}</td>
```

---

### Task 2.3 — Add Sales Rep Dashboard Filtering

**File**: `client/src/pages/SalesRepDashboard.jsx`

**What**: Sales reps should only see their own sales. Backend now tracks `user_id` (from Task 1.3).

**Instructions**:
1. In the fetch, filter sales by `user_id`:
```js
const mySales = salesRes.data.filter(sale => sale.user_id === user.id);
```
2. Also update the backend sales route to optionally filter by `user_id`:
   - `GET /api/sales?user_id=1` returns only that user's sales

---

### Task 2.4 — Replace `alert()` with Toast Notifications

**Files**: `Sales.jsx`, `Inventory.jsx`, `AdminDashboard.jsx` (anywhere `alert()` is used)

**What**: Build a simple toast component instead of blocking `alert()` dialogs.

**New file**: `client/src/components/Toast.jsx`

```jsx
import { useState, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

Wrap `App.jsx` with `<ToastProvider>`:
```jsx
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <div className="App">...</div>
    </ToastProvider>
  );
}
```

Add toast styles in CSS:
```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toast {
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;
}
.toast-success { background: #22c55e; }
.toast-error { background: #ef4444; }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

Replace:
- `alert('Sale completed successfully!')` → `addToast('Sale completed successfully!', 'success')`
- `alert('Error processing sale')` → `addToast('Error processing sale', 'error')`

---

### Task 2.5 — Add Loading Skeletons

**Files**: All pages

**What**: Replace `<div>Loading...</div>` text with a skeleton placeholder.

**Instructions**:
1. Create a simple Skeleton component or use CSS animation
2. Each page's loading state shows a skeleton matching the page layout

**Simple approach** (add to `index.css`):
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  height: 20px;
  margin-bottom: 0.5rem;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Replace loading returns with skeleton layouts.

---

### Task 2.6 — Make `expiry_date` Optional

**File**: `client/src/pages/Inventory.jsx:287`, `server/src/controllers/inventoryController.js:29`

**What**: Remove the `required` attribute from the expiry date input in the form, and update the backend validation to not require it.

**Frontend**: Change `<input ... required />` to just `<input ... />` for `expiry_date`.

**Backend**: In `createProduct()`:
```js
if (!name || !category || !price || !stock_quantity) {
    return res.status(400).json({ message: 'All fields are required' });
}
```
Remove `|| !expiry_date` from the check.

**Verification**: Create a product without an expiry date — it saves successfully.

---

### Phase 2 Verification

- Search works on Sales page (real-time filtering)
- Category filter works
- Reports show product names, not numeric IDs
- Sales rep sees only their own sales
- Toast notifications appear (no more `alert()` dialogs)
- Loading states show skeletons, not plain text
- Products can be saved without expiry dates

---

## Phase 3: Data Layer Refactor ✅

**Objective**: Abstract data access so adding offline support later doesn't require rewriting every page.

**Effort**: 2 days ✅  
**Status**: Complete  
**Dependencies**: Phase 2 complete

### Task 3.1 — Create Custom Data Hooks

**New directory**: `client/src/hooks/`

Create custom hooks that wrap API calls. This is the foundation for swapping to IndexedDB later.

**File**: `client/src/hooks/useProducts.js`
```js
import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/inventory');
      setProducts(res.data.products || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addProduct = async (data) => {
    const res = await API.post('/inventory', data);
    await fetchProducts();
    return res.data;
  };

  const updateProduct = async (id, data) => {
    const res = await API.put(`/inventory/${id}`, data);
    await fetchProducts();
    return res.data;
  };

  const deleteProduct = async (id) => {
    await API.delete(`/inventory/${id}`);
    await fetchProducts();
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}
```

**File**: `client/src/hooks/useSales.js`
```js
import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/sales');
      setSales(res.data.sales || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const createSale = async (productId, quantity) => {
    const res = await API.post('/sales', { product_id: productId, quantity });
    await fetchSales();
    return res.data;
  };

  return { sales, loading, createSale, refetch: fetchSales };
}
```

**Also create**:
- `useAuth.js` — login, logout, current user
- `useReports.js` — all report endpoints
- `useOnlineStatus.js` — `navigator.onLine` + ping-based detection

### Task 3.2 — Refactor Pages to Use Hooks

**Before** (Sales.jsx):
```jsx
const [products, setProducts] = useState([]);
useEffect(() => {
  const token = localStorage.getItem('token');
  API.get('/inventory', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => setProducts(res.data.products));
}, []);
```

**After**:
```jsx
const { products, loading } = useProducts();
```

**Files to update**:
- `Sales.jsx` → use `useProducts()`, `useSales()`
- `Inventory.jsx` → use `useProducts()`
- `AdminDashboard.jsx` → use `useReports()`
- `Reports.jsx` → use `useReports()`
- `Login.jsx` → use `useAuth()`

### Task 3.3 — Add Zustand for Global State

**Install**: `npm install zustand`

**File**: `client/src/store/authStore.js`
```js
import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
```

**File**: `client/src/store/cartStore.js`
```js
import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      return { items: state.items.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      )};
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  clearCart: () => set({ items: [] }),
  totalAmount: () => {
    // computed — call from component
  }
}));
```

**Refactor `App.jsx`** to use the auth store instead of `useState`/`localStorage`.

---

### Phase 3 Verification

- All pages work exactly as before but now use custom hooks
- Zustand store works for auth (login/logout flow is identical)
- No regressions in any page functionality
- The app still starts and runs without errors

---

## Phase 4: Offline-First Implementation ✅

**Objective**: App works fully offline, syncs when connectivity returns.

**Effort**: 5 days ✅  
**Status**: Complete  
**Dependencies**: Phase 3 complete (data hooks in place)

### Task 4.1 — Install Dexie.js and Set Up IndexedDB

**Install**: `npm install dexie`

**File**: `client/src/db/index.js`
```js
import Dexie from 'dexie';

export const db = new Dexie('PharmacyPOS');

db.version(1).stores({
  products: '++id, name, category, stock_quantity',
  sales: '++id, product_id, user_id, created_at',
  syncQueue: '++id, action, table, recordId, timestamp',
  users: '++id, email, role',
});
```

### Task 4.2 — Create Data Access Layer (Repository)

**File**: `client/src/db/repository.js`

This file checks connectivity and routes reads/writes appropriately:

```js
import API from '../services/api';
import { db } from './index';

export const ProductRepository = {
  async getAll() {
    if (navigator.onLine) {
      const res = await API.get('/inventory');
      const products = res.data.products || [];
      await db.products.clear();
      await db.products.bulkAdd(products);
      return products;
    }
    return await db.products.toArray();
  },

  async add(product) {
    if (navigator.onLine) {
      const res = await API.post('/inventory', product);
      return res.data.product;
    }
    const id = await db.products.add({ ...product, _pending: true });
    await db.syncQueue.add({
      action: 'create', table: 'products', recordId: id, timestamp: Date.now(), data: product
    });
    return { ...product, id, _pending: true };
  },
  // ... update, delete
};

export const SaleRepository = {
  async add(saleData) {
    if (navigator.onLine) {
      const res = await API.post('/sales', saleData);
      return res.data.sale;
    }
    const id = await db.sales.add({ ...saleData, _pending: true });
    await db.syncQueue.add({
      action: 'create', table: 'sales', recordId: id, timestamp: Date.now(), data: saleData
    });
    return { ...saleData, id, _pending: true };
  },
};
```

### Task 4.3 — Create Sync Engine

**File**: `client/src/db/sync.js`
```js
import { db } from './index';
import API from '../services/api';

export async function syncPendingChanges() {
  if (!navigator.onLine) return { synced: 0, errors: 0 };

  const queue = await db.syncQueue.orderBy('timestamp').toArray();

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'create':
          await API.post(`/${item.table}`, item.data);
          break;
        // case 'update': ...
        // case 'delete': ...
      }
      await db.syncQueue.delete(item.id);
    } catch (err) {
      console.error(`Sync failed for ${item.table} #${item.recordId}:`, err);
    }
  }

  return { synced: queue.length };
}
```

### Task 4.4 — Create Sync Hook & Periodic Sync

**File**: `client/src/hooks/useSync.js`
```js
import { useEffect, useRef } from 'react';
import { syncPendingChanges } from '../db/sync';

export function useSync(intervalMs = 30000) {
  const intervalRef = useRef(null);

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;
      const result = await syncPendingChanges();
      if (result.synced > 0) {
        console.log(`Synced ${result.synced} pending changes`);
      }
    };

    sync(); // immediate sync on mount
    intervalRef.current = setInterval(sync, intervalMs);

    const handleOnline = () => { sync(); };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
    };
  }, [intervalMs]);
}
```

### Task 4.5 — Add Connectivity Indicator

**File**: `client/src/components/ConnectivityIndicator.jsx`
```jsx
import { useState, useEffect } from 'react';

export function ConnectivityIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner">
      ⚠️ You are offline — changes will sync when connection is restored
    </div>
  );
}
```

**Style**:
```css
.offline-banner {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #f59e0b; color: white; text-align: center;
  padding: 0.5rem; font-weight: 500; z-index: 9999;
}
```

### Task 4.6 — Register Service Worker

**File**: `client/src/sw.js` (or use Workbox via Vite plugin)

**Instructions**: Use `vite-plugin-pwa` for easy Service Worker setup:
```bash
npm install vite-plugin-pwa
```

Update `vite.config.js`:
```js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:5000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            }
          }
        ]
      },
      manifest: {
        name: 'Pharmacy POS',
        short_name: 'POS',
        display: 'standalone',
        theme_color: '#1a1a2e',
      }
    })
  ]
});
```

### Task 4.7 — Add Sync Endpoint to Server

**File**: `server/src/routes/sync.js` (new)

```js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Product = require('../models/product');
const Sale = require('../models/sale');

// Accept a batch of offline mutations
router.post('/', auth, async (req, res) => {
  try {
    const { mutations } = req.body;
    const results = [];

    for (const mutation of mutations) {
      try {
        switch (mutation.table) {
          case 'products':
            if (mutation.action === 'create') {
              const p = await Product.create(mutation.data);
              results.push({ success: true, id: p.id, localId: mutation.recordId });
            }
            break;
          case 'sales':
            if (mutation.action === 'create') {
              const s = await Sale.create({ ...mutation.data, user_id: req.userId });
              results.push({ success: true, id: s.id, localId: mutation.recordId });
            }
            break;
        }
      } catch (err) {
        results.push({ success: false, localId: mutation.recordId, error: err.message });
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Sync failed', error: err.message });
  }
});

module.exports = router;
```

Mount in `server.js`:
```js
app.use('/api/sync', require('./routes/sync'));
```

---

### Phase 4 Verification

1. **Go offline** (DevTools → Network → Offline)
2. Navigate the app — all pages render from IndexedDB
3. Create a product while offline — it appears in the list
4. Create a sale while offline — it appears
5. **Go back online** — pending changes sync automatically
6. Refresh the page — all data is still there
7. The offline banner appears when offline, disappears when online

---

## Phase 5: UI Component System ✅

**Objective**: Consistent, accessible, fast UI using Tailwind CSS + shadcn/ui.

**Effort**: 3 days ✅  
**Status**: Complete  
**Dependencies**: Phase 4 complete

### Task 5.1 — Install & Configure Tailwind CSS

```bash
cd client
npm install -D tailwindcss @tailwindcss/vite
```

Update `vite.config.js`:
```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), ...]
});
```

Replace `index.css` content with Tailwind directives:
```css
@import "tailwindcss";
```

### Task 5.2 — Install shadcn/ui

```bash
npx shadcn@latest init
```

Components to add initially:
- `Button` — for all buttons
- `Input` — for form inputs
- `Select` — for dropdowns
- `Table` — for data tables
- `Card` — for dashboard cards
- `Dialog` — for confirmations
- `Toast` — for notifications (replaces custom Toast)

### Task 5.3 — Migrate Pages One by One

Start with the most-used page (Sales) and work outward:
1. Sales page
2. Inventory page
3. Admin Dashboard
4. Sales Rep Dashboard
5. Login / Register
6. Reports

For each page:
1. Remove old CSS file import
2. Replace HTML elements with shadcn components
3. Use Tailwind utility classes for layout

**No rush on this phase** — it can be done incrementally.

---

## Phase 6: Production Hardening

**Objective**: Security, testing, documentation, deployment readiness.

**Effort**: 3 days  
**Dependencies**: Phase 5 complete (or can start after Phase 3)

### Task 6.1 — Security Hardening

| Task | Package / File | Instruction |
|---|---|---|
| Rate limiting | `npm install express-rate-limit` (server) | Limit login to 5 attempts/15min |
| Security headers | `npm install helmet` (server) | `app.use(helmet())` |
| CORS restriction | Update `server.js` | `origin: process.env.CORS_ORIGIN` instead of `*` |
| Input validation | `npm install zod` (shared) | Create schemas, validate in controllers |
| Configurable reg code | `.env` + `authController.js` | `ADMIN_REGISTRATION_CODE=...` |

### Task 6.2 — Testing Setup

**Install**: `npm install -D vitest @testing-library/react @testing-library/jest-dom supertest` (client)
**Install**: `npm install -D jest supertest` (server, or use vitest for both)

**Test files to create**:

| Test file | What it tests |
|---|---|
| `server/tests/auth.test.js` | Login, register, JWT validation |
| `server/tests/inventory.test.js` | CRUD operations |
| `server/tests/sales.test.js` | Sale creation, stock deduction, transactions |
| `client/src/__tests__/Sales.test.jsx` | Add to cart, remove from cart, checkout |
| `client/src/__tests__/Inventory.test.jsx` | Product form, CSV import |
| `client/src/__tests__/Auth.test.jsx` | Login flow |

### Task 6.3 — Pagination

**Server**: Update all list endpoints to accept `page` and `limit` query params:
```js
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 50;
const offset = (page - 1) * limit;

const { rows, count } = await Product.findAndCountAll({ limit, offset });
res.json({ products: rows, total: count, page, totalPages: Math.ceil(count / limit) });
```

**Client**: Update hooks to accept pagination params. Add "Load More" or page controls.

### Task 6.4 — README Rewrite

**File**: `readme.md`

Rewrite with accurate information:
- Actual tech stack (Node.js, Express, React, SQLite)
- Real installation steps
- No Python/Django references
- No MySQL references (or add MySQL instructions as alternative)
- Add screenshots
- Add development workflow

### Task 6.5 — Add TypeScript (Optional / Incremental)

Choose either:
- **Full migration**: Rename all `.jsx` → `.tsx`, `.js` → `.ts`, add types
- **Incremental**: Start with shared types file, add to new files only

**Recommended**: Start incremental with just the Zod schemas as the source of truth for types.

---

## Summary Timeline

```
Phase 0: Prep & Safety           [0.5 day]  ══════
Phase 1: Critical Fixes          [1 day]    ══════════════
Phase 2: UX Improvements         [2 days]   ════════════════════════════
Phase 3: Data Layer Refactor     [2 days] ✅ ════════════════════════════
Phase 4: Offline-First           [5 days] ✅ ══════════════════════════════════════════════════
Phase 5: UI Component System     [3 days] ✅ ══════════════════════════════════════════
Phase 6: Production Hardening    [3 days]   ══════════════════════════════════════════
                                        ──────────────────────────────────
Total: 15-20 days
```

**Can be parallelized**:
- Phases 1 + 2 are prerequisites for everything else (sequential)
- Phase 5 can start in parallel with Phase 4 (different concerns)
- Phase 6 can start after Phase 3 (doesn't need Phase 4 or 5)

---

## Quick Reference: Most Common Commands

```bash
# Development
cd server && npm run dev          # Start backend on :5000
cd client && npm run dev          # Start frontend on :3000

# Database reset (delete all data)
rm server/data/pos.db && cd server && npm run dev

# Install new package
cd client && npm install <pkg>

# Check git status
git status

# Commit checkpoint
git add -A && git commit -m "checkpoint: description"
```

---

## Appendix: File Map After Implementation

```
POS/
├── POS_REVIEW.md                     # Analysis document
├── IMPLEMENTATION_PLAN.md            # This file
├── readme.md                         # Rewritten
│
├── client/
│   ├── src/
│   │   ├── main.jsx                  # + register SW
│   │   ├── App.jsx                   # + ToastProvider, auth store
│   │   │
│   │   ├── features/                 # NEW: feature-based structure
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── useAuth.js        # moved from hooks/
│   │   │   │   └── auth.schema.ts    # NEW: Zod validation
│   │   │   ├── sales/
│   │   │   │   ├── Sales.jsx
│   │   │   │   ├── Cart.jsx          # extracted from Sales
│   │   │   │   ├── ProductGrid.jsx   # extracted from Sales
│   │   │   │   └── useSales.js
│   │   │   ├── inventory/
│   │   │   │   ├── Inventory.jsx
│   │   │   │   ├── ProductForm.jsx   # extracted
│   │   │   │   ├── CSVImport.jsx     # extracted
│   │   │   │   └── useProducts.js
│   │   │   └── reports/
│   │   │       ├── Reports.jsx
│   │   │       └── useReports.js
│   │   │
│   │   ├── components/               # Shared UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Toast.jsx             # improved
│   │   │   ├── ConnectivityIndicator.jsx  # NEW
│   │   │   └── Skeleton.jsx          # NEW
│   │   │
│   │   ├── db/                       # NEW: data layer
│   │   │   ├── index.js              # Dexie setup
│   │   │   ├── repository.js         # Online/offline router
│   │   │   └── sync.js               # Sync engine
│   │   │
│   │   ├── store/                    # NEW: Zustand stores
│   │   │   ├── authStore.js
│   │   │   └── cartStore.js
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useOnlineStatus.js
│   │   │   └── useSync.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js                # unchanged
│   │   │
│   │   └── styles/                   # reduced as Tailwind takes over
│   │       └── (remaining CSS files)
│   │
│   └── sw.js                         # NEW: Service Worker
│
├── server/
│   ├── data/
│   │   └── pos.db                    # NEW: persistent database
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # UPDATED: file-based SQLite
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── inventory.js
│   │   │   ├── sales.js
│   │   │   ├── reports.js
│   │   │   └── sync.js               # NEW: sync endpoint
│   │   ├── controllers/
│   │   │   ├── authController.js     # UPDATED: configurable reg code
│   │   │   ├── inventoryController.js # CLEANED: no duplicates
│   │   │   ├── salesController.js    # UPDATED: transaction, user_id
│   │   │   ├── reportController.js   # CLEANED: no duplicates
│   │   │   └── syncController.js     # NEW
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # unchanged
│   │   ├── models/
│   │   │   ├── user.js               # + associations
│   │   │   ├── product.js            # + associations
│   │   │   └── sale.js               # + user_id, associations
│   │   └── server.js                 # UPDATED: helmet, rate-limit, CORS
│   └── .env                          # CREATED
│
└── SETUP_DATABASE.sql                # DELETED
└── setup.sql                         # DELETED
```

---

*End of Implementation Plan*
