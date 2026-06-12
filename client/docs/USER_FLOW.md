# User Flow & System Architecture

> Complete user journey and screen map for a professional Pharmacy POS system.

---

## 1. Roles & Permissions

| Capability | Sales Attendant | Admin |
|------------|:---------------:|:-----:|
| Process sales (POS) | ✅ | ✅ |
| Process returns | ✅ | ✅ |
| View own sales history | ✅ | ✅ |
| View all sales history | ❌ | ✅ |
| Add products to inventory | ❌ | ✅ |
| Edit/delete products | ❌ | ✅ |
| Bulk import products (CSV) | ❌ | ✅ |
| View inventory (read-only) | ✅ | ✅ |
| Manage users | ❌ | ✅ |
| View financial reports | ❌ | ✅ |
| Configure system settings | ❌ | ✅ |
| Register new sales attendants | ❌ | ✅ |
| View personal dashboard | ✅ | ✅ |
| View admin dashboard | ❌ | ✅ |
| Apply discounts | *configurable* | ✅ |
| Reprint receipts | ✅ | ✅ |

---

## 2. Route Map

```
/login                     →  Login
/register                  →  Register (admin-only registration)

/                          →  Root (redirects to /pos or /admin/dashboard)

── Sales Attendant Routes ──
/pos                       →  POS Terminal (primary screen)
/sales                     →  Sales History
/sales/:id                 →  Sale Detail & Receipt
/returns                   →  Process Return
/returns/:saleId           →  Return from Specific Sale
/dashboard                 →  Sales Attendant Dashboard
/profile                   →  Account & Settings

── Admin Routes ──
/admin                     →  Redirects to /admin/dashboard
/admin/dashboard           →  Admin Dashboard
/admin/pos                 →  POS Terminal (step in for sales)
/admin/sales               →  All Sales History
/admin/sales/:id           →  Sale Detail & Receipt
/admin/returns             →  Process Returns
/admin/returns/:saleId     →  Return from Specific Sale

/admin/inventory            →  Inventory Management
/admin/inventory/new        →  Add Product
/admin/inventory/:id/edit   →  Edit Product
/admin/inventory/import     →  Bulk Import (CSV)
/admin/inventory/adjust     →  Stock Adjustment

/admin/users               →  User Management
/admin/users/new            →  Register Sales Attendant
/admin/users/:id/edit       →  Edit User
/admin/users/:id/deactivate →  Deactivate User

/admin/reports              →  Reports Dashboard
/admin/reports/sales        →  Sales Reports (daily/weekly/monthly/custom)
/admin/reports/products     →  Top Products
/admin/reports/inventory    →  Inventory Valuation
/admin/reports/activity     →  User Activity Log

/admin/settings             →  System Settings
/admin/settings/store       →  Store Information
/admin/settings/tax         →  Tax Configuration
/admin/settings/receipt     →  Receipt Template
/admin/settings/backup      →  Backup & Restore

── Shared Components (rendered inline) ──
/components/pos             →  POS Terminal widget
/components/product-picker  →  Product search modal
/components/payment-modal   →  Payment processing modal
/components/receipt-view    →  Receipt preview
```

---

## 3. Sales Attendant User Flow

### 3.1 Login → Daily Start

```
[Start of Shift]
      │
      ▼
┌──────────────┐
│    Login     │  Enter email + password
│  ──────────  │  
│  📧 Email    │
│  🔒 Password │
│              │
│ [Sign In]    │
│              │
│ Register?    │──→ /register (if no account yet)
└──────┬───────┘
       │
       │ Authenticate
       ▼
┌──────────────────────┐
│  POS Terminal (/pos) │  ← Redirected immediately
│  ─────────────────── │     (no time-wasting dashboard)
│                      │     
│  "Ready for sales"   │     
│  [New Sale]          │     
└──────────────────────┘
```

**Principle:** Sales attendants go directly to POS. No dashboard detour. Every second counts at the counter.

---

### 3.2 Core Sale Flow

```
┌─────────────────────────────────────────────────┐
│  POS TERMINAL (/pos)                            │
│                                                 │
│  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  Product Search      │  │  Current Cart     │ │
│  │  ─────────────       │  │  ───────────       │ │
│  │  [🔍 Search...]      │  │  Items (2)         │ │
│  │                      │  │                    │ │
│  │  Category Filter     │  │  Paracetamol ×2    │ │
│  │  [All ▼]             │  │    ₵11.98          │ │
│  │                      │  │                    │ │
│  │  ┌────┐ ┌────┐      │  │  Aspirin ×1        │ │
│  │  │Pill │ │Cough│     │  │    ₵3.50           │ │
│  │  │₵5.99│ │₵8.50│    │  │                    │ │
│  │  │     │ │     │     │  │  ────────────       │ │
│  │  └───┬─┘ └──┬─┘     │  │  Subtotal: ₵15.48  │ │
│  │      │       │       │  │  Tax:       ₵1.55  │ │
│  │  ┌────┐ ┌────┐      │  │  TOTAL:    ₵17.03  │ │
│  │  │Vita│ │... │      │  │                    │ │
│  │  │₵...│ │ │  │      │  │  [Customer: Walk-in]│ │
│  │  └────┘ └────┘      │  │                    │ │
│  │                      │  │  ▼▼▼               │ │
│  └──────────────────────┘  │  [🧾 Pay ₵17.03]  │ │
│                            └────────┬───────────┘ │
└──────────────────────────────────────┼─────────────┘
                                       │
              User taps "Pay"          │
                                       ▼
┌──────────────────────────────────────────────────┐
│  PAYMENT MODAL                                    │
│                                                   │
│  Total Due: ₵17.03                                │
│                                                   │
│  [💵 Cash]    [💳 Card]    [📱 Mobile Money]     │
│                                                   │
│  ── Or ──                                         │
│                                                   │
│  Amount Received: [__________]                     │
│  Change Due:    ₵0.00                             │
│                                                   │
│  [✔ Confirm Payment]  [✕ Cancel]                  │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  SALE COMPLETE                                    │
│                                                   │
│  ✔ Sale completed successfully!                   │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  RECEIPT                                      │ │
│  │  ─────────────────────────                   │ │
│  │  Pharmacy POS                        │ │
│  │  123 Main St                                 │ │
│  │  Tel: 555-0100                               │ │
│  │                                              │ │
│  │  #REC-20240611-0042                          │ │
│  │  Attendant: John                            │ │
│  │  11 Jun 2026  14:32                         │ │
│  │  ─────────────────────────                   │ │
│  │  Paracetamol 500mg    ×2     ₵11.98         │ │
│  │  Aspirin 100mg        ×1     ₵3.50          │ │
│  │  ─────────────────────────                   │ │
│  │  Subtotal                 ₵15.48             │ │
│  │  Tax (10%)                ₵1.55              │ │
│  │  TOTAL                    ₵17.03             │ │
│  │  Paid: Cash               ₵20.00             │ │
│  │  Change:                  ₵2.97              │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  [🖨 Print]  [📧 Email]  [↩ New Sale]  [✕ Close] │
└───────────────────────────────────────────────────┘
```

**States during sale:**

| State | What user sees |
|-------|----------------|
| Empty cart | "Add products to begin sale" — search prompt visible |
| Products selected | Cart shows items, total updates live |
| Out-of-stock tapped | `disabled` state on product card, tooltip "Out of Stock" |
| Payment processing | Spinner overlay: "Processing payment..." |
| Sale complete | Receipt view with print/email/new-sale options |
| Network offline while processing | Fallback: save locally, queue for sync, show warning |

---

### 3.3 Returns Flow

```
From POS Terminal or Sidebar
           │
           ▼
┌─────────────────────────────────────────────────┐
│  PROCESS RETURN (/returns)                       │
│                                                  │
│  How would you like to find the sale?            │
│                                                  │
│  [🔍 Search by Receipt #]  [── Or ──]            │
│  [📅 Browse by Date]                             │
│                                                  │
│  ── Recent Sales ──                              │
│  #REC-0042  John   14:32  ₵17.03  [Select]    │
│  #REC-0041  Jane   13:15  ₵8.50   [Select]    │
│  #REC-0040  John   11:00  ₵23.00  [Select]    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  RETURN ITEMS                                    │
│                                                  │
│  Sale: #REC-0042 | 11 Jun 2026                  │
│  Customer: Walk-in                              │
│                                                  │
│  ☑ Paracetamol 500mg    ×2     ₵11.98           │
│  ☐ Aspirin 100mg        ×1     ₵3.50  ← partial │
│                                                  │
│  Refund Method: [Original ▼]                     │
│  Reason: [Defective ▼]                           │
│                                                  │
│  Refund Total: ₵3.50                             │
│                                                  │
│  [✔ Process Return]  [✕ Cancel]                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  RETURN COMPLETE                                 │
│                                                  │
│  ✔ Return processed successfully                 │
│  Refund: ₵3.50 → Cash                           │
│                                                  │
│  Stock updated: Aspirin +1                       │
│                                                  │
│  [🖨 Print Return Receipt]  [↩ New Return]  [✕]  │
└──────────────────────────────────────────────────┘
```

---

### 3.4 Sales History Flow

```
From Sidebar (Sales History)
           │
           ▼
┌─────────────────────────────────────────────────┐
│  SALES HISTORY (/sales)                          │
│                                                  │
│  [🔍 Search]  [📅 Filter: Today ▼]              │
│                                                  │
│  ┌────┬────────────┬───────┬───────┬─────────┐  │
│  │ #  │ Date/Time  │ Items │ Total │ Status  │  │
│  ├────┼────────────┼───────┼───────┼─────────┤  │
│  │042 │14:32       │  3    │₵17.03 │ ✔ Synced│  │
│  │041 │13:15       │  1    │₵8.50  │ ✔ Synced│  │
│  │040 │11:00       │  5    │₵23.00 │ ⏳ Pend..│  │  ← pending sync
│  │039 │09:45       │  2    │₵12.50 │ ✔ Synced│  │
│  └────┴────────────┴───────┴───────┴─────────┘  │
│                                                  │
│  Rows per page: [20 ▼]   1-4 of 39             │
└──────────────────────┬──────────────────────────┘
                       │
          Tap a row    │
                       ▼
┌─────────────────────────────────────────────────┐
│  SALE DETAIL (/sales/:id)                        │
│                                                  │
│  Receipt #REC-0042                               │
│  Date: 11 Jun 2026  14:32                       │
│  Attendant: John Doe                            │
│  Status: ✔ Completed                            │
│                                                  │
│  ┌──────────┬──────┬──────┬────────┐            │
│  │ Product  │ Qty  │ Price│ Total │            │
│  ├──────────┼──────┼──────┼────────┤            │
│  │ Paracet. │  2   │₵5.99│ ₵11.98│            │
│  │ Aspirin  │  1   │₵3.50│ ₵3.50 │            │
│  ├──────────┴──────┴──────┴────────┤            │
│  │ Subtotal              ₵15.48   │            │
│  │ Tax (10%)             ₵1.55    │            │
│  │ TOTAL                 ₵17.03   │            │
│  │ Payment: Cash         ₵20.00   │            │
│  │ Change:               ₵2.97    │            │
│  └─────────────────────────────────┘            │
│                                                  │
│  [🖨 Reprint]  [↩ Process Return]  [✕ Close]    │
└──────────────────────────────────────────────────┘
```

---

### 3.5 Sales Attendant Dashboard

```
From Sidebar (Dashboard)
           │
           ▼
┌──────────────────────────────────────────────────┐
│  MY DASHBOARD (/dashboard)                       │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Today's  │ │ My Sales │ │ My       │          │
│  │ Sales    │ │ Today    │ │ Commision│          │
│  │ ₵1,234   │ │    12    │ │   ₵61.70 │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                   │
│  ── Quick Actions ──                              │
│  [🧾 New Sale]  [↩ Process Return]  [📋 Today's]│
│                                                   │
│  ── My Recent Transactions ──                     │
│  ┌────┬────────┬──────┬────────┬──────────┐      │
│  │ #  │ Time   │Items │ Total  │ Status   │      │
│  ├────┼────────┼──────┼────────┼──────────┤      │
│  │042 │ 14:32  │  3   │ ₵17.03│ ✔ Synced │      │
│  │040 │ 11:00  │  5   │ ₵23.00│ ⏳ Pending│      │
│  │039 │ 09:45  │  2   │ ₵12.50│ ✔ Synced │      │
│  └────┴────────┴──────┴────────┴──────────┘      │
│                                                   │
│  ── Low Stock Alerts ──                           │
│  ⚠ Aspirin 100mg — Only 3 left                  │
│  ⚠ Bandages — Only 5 left                        │
└──────────────────────────────────────────────────┘
```

---

### 3.6 Profile / Account

```
From Sidebar (My Account)
           │
           ▼
┌──────────────────────────────────────────────────┐
│  MY ACCOUNT (/profile)                            │
│                                                   │
│  John Doe                                         │
│  Sales Attendant                                  │
│  john@pharmacy.com                                │
│                                                   │
│  ───────────                                      │
│  [🔑 Change Password]                             │
│  [📊 My Performance Stats]                         │
│  [📱 Update Contact Info]                         │
│                                                   │
│  ── Session ──                                     │
│  Logged in since: 08:30 AM                       │
│  Transactions today: 12                           │
│                                                   │
│  [🚪 Sign Out]                                    │
└──────────────────────────────────────────────────┘
```

---

### 3.7 Sales Attendant Complete Navigation Map

```
                    ┌──────────┐
                    │  LOGIN   │
                    └────┬─────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│                     SIDEBAR                        │
│                                                    │
│  🧾 [POS Terminal]  ──────────►  /pos             │
│  📊 [Dashboard]      ──────────►  /dashboard       │
│  📋 [Sales History]  ──────────►  /sales           │
│  🔄 [Returns]        ──────────►  /returns         │
│  📦 [Inventory]      ──────────►  /inventory       │
│  👤 [My Account]     ──────────►  /profile         │
│                                                    │
│  ─────────────────────────────                      │
│  🚪 [Sign Out]                                     │
└────────────────────────────────────────────────────┘

Note: /inventory is READ-ONLY for sales attendants.
      They can view stock and prices but not add/edit/delete.
```

---

## 4. Admin User Flow

### 4.1 Login → Dashboard

```
[Start of Day]
      │
      ▼
┌──────────────┐
│    Login     │  Enter email + password
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD (/admin/dashboard)                │
│                                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │₵15,430│ │ 342  │ │  12  │ │  GHS │              │
│  │Revenue│ │Sales │ │Low   │ │Val:  │              │
│  │Today  │ │Today │ │Stock │ │₵230k │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                    │
│  ┌─── Sales Trend (7 days) ───────────────────┐    │
│  │  ██                                        │    │
│  │  ██ ██                                     │    │
│  │  ██ ██ ██    ██                            │    │
│  │  ██ ██ ██ ██ ██ ██ ██                      │    │
│  │  ██ ██ ██ ██ ██ ██ ██ ██                   │    │
│  │  ────────────────────────────────────      │    │
│  │  M  T  W  T  F  S  S                      │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  ⚠ Action Required: 12 low-stock items            │
│  📋 3 pending sync items                           │
│                                                    │
│  ── Recent Transactions ──                          │
│  John: ₵17.03  |  Jane: ₵44.50  |  John: ₵8.00   │
│                                                    │
│  [🧾 POS] [📦 Inventory] [📈 Reports] [👥 Users]  │
└────────────────────────────────────────────────────┘
```

---

### 4.2 Admin Full Navigation Map

```
                    ┌──────────┐
                    │  LOGIN   │
                    └────┬─────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                   ADMIN SIDEBAR                      │
│                                                      │
│  📊 [Dashboard]         ──────────►  /admin/dashboard│
│  🧾 [POS Terminal]      ──────────►  /admin/pos     │
│  📋 [All Sales]         ──────────►  /admin/sales    │
│  🔄 [Returns]           ──────────►  /admin/returns  │
│  📦 [Inventory] ────────►  /admin/inventory          │
│     ├─ ➕ Add Product   ──►  /admin/inventory/new    │
│     ├─ 📥 Bulk Import   ──►  /admin/inventory/import │
│     └─ 📊 Stock Adjust  ──►  /admin/inventory/adjust │
│                                                      │
│  👥 [Users] ─────────────►  /admin/users             │
│     └─ ➕ Register Rep   ──►  /admin/users/new       │
│                                                      │
│  📈 [Reports] ───────────►  /admin/reports           │
│     ├─ 📅 Sales Report   ──►  /admin/reports/sales   │
│     ├─ 🏆 Top Products   ──►  /admin/reports/products│
│     ├─ 💰 Inventory Val  ──►  /admin/reports/inventory│
│     └─ 👤 Activity Log   ──►  /admin/reports/activity│
│                                                      │
│  ⚙ [Settings] ───────────►  /admin/settings          │
│     ├─ 🏪 Store Info     ──►  /admin/settings/store  │
│     ├─ 💲 Tax Config     ──►  /admin/settings/tax    │
│     ├─ 🧾 Receipt        ──►  /admin/settings/receipt│
│     └─ 💾 Backup         ──►  /admin/settings/backup │
│                                                      │
│  ─────────────────────────────────                    │
│  🚪 [Sign Out]                                       │
└──────────────────────────────────────────────────────┘
```

---

### 4.3 Inventory Management Flow (Admin)

```
/admin/inventory
      │
      ▼
┌────────────────────────────────────────────────────┐
│  INVENTORY MANAGEMENT                              │
│                                                    │
│  [🔍 Search]  [📂 Category ▼]  [⚠ Low Stock Only] │
│                                                    │
│  [+ Add Product]  [📥 Bulk Import]  [📊 Adjust]   │
│                                                    │
│  ┌────┬──────────┬──────┬──────┬───────┬────────┐ │
│  │    │ Name     │ Cat  │Price │ Stock │ Expiry │ │
│  ├────┼──────────┼──────┼──────┼───────┼────────┤ │
│  │ ⚠  │ Aspirin  │ Pain │₵3.50│   3   │ Nov 25 │ │
│  │ ✓  │ Paracet. │ Pain │₵5.99│  45   │ Dec 25 │ │
│  │ ✗  │ Antibio. │ Top  │₵12.0│   0   │ -      │ │  ← out of stock
│  └────┴──────────┴──────┴──────┴───────┴────────┘ │
│                                                    │
│  ── Stock Status Legend ──                          │
│  ✓ In Stock  |  ⚠ Low (<10)  |  ✗ Out of Stock    │
│  📅 Expiring within 30 days highlighted in amber    │
└───────┬────────────────────────────────────────────┘
        │
        │ Tap row → edit modal
        │ [+ Add Product] → full form
        ▼
┌────────────────────────────────────────────────────┐
│  ADD / EDIT PRODUCT (/admin/inventory/new)          │
│  ──────────────────────────────────────              │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Product Information                          │  │
│  │                                              │  │
│  │  Name:       [___________________________]   │  │
│  │  Category:   [___________________________]   │  │
│  │  Price (₵):  [___________________________]   │  │
│  │  Barcode:    [___________________________]   │  │
│  │  Stock Qty:  [___________________________]   │  │
│  │  Min Stock:  [___________________________]   │  │  ← low stock threshold
│  │  Expiry:     [___________]                    │  │
│  │  Supplier:   [___________________________]   │  │
│  │                                              │  │
│  │  [💾 Save]  [✕ Cancel]                       │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

### 4.4 User Management Flow (Admin)

```
/admin/users
      │
      ▼
┌────────────────────────────────────────────────────┐
│  USER MANAGEMENT                                   │
│                                                    │
│  [+ Register Sales Attendant]                      │
│                                                    │
│  ┌──────┬──────────┬────────────┬────────┬───────┐ │
│  │ Role │ Name     │ Email      │ Active │ Since │ │
│  ├──────┼──────────┼────────────┼────────┼───────┤ │
│  │ 👑   │ Admin    │admin@p... │ ✔     │ Jan 24│ │
│  │ ⭐   │ John Doe │john@p...  │ ✔     │ Feb 24│ │
│  │ ⭐   │ Jane Doe │jane@p...  │ ✔     │ Mar 24│ │
│  │ ⭐   │ Bob Smith│bob@p...   │ ✘      │ Jan 24│ │  ← deactivated
│  └──────┴──────────┴────────────┴────────┴───────┘ │
│                                                    │
│  [Edit]  [Deactivate]  [Reset Password]            │
└────────────────────────────────────────────────────┘
```

---

### 4.5 Reports Flow (Admin)

```
/admin/reports
      │
      ▼
┌────────────────────────────────────────────────────┐
│  REPORTS DASHBOARD                                 │
│                                                    │
│  ┌─ Sales ─────────────────────┐                   │
│  │  Select period: [This Week ▼]                   │
│  │  ┌── Chart ──────────────┐  │                   │
│  │  │  ██ ██ ██    ██       │  │                   │
│  │  └───────────────────────┘  │                   │
│  │  Total: ₵23,450 │ Orders: 523                  │
│  │  [📄 View Full Report]     │                   │
│  ├── Top Products ────────────┤                   │
│  │  1. Paracetamol   — 342 units sold              │
│  │  2. Vitamin C     — 215 units sold              │
│  │  3. Aspirin       — 198 units sold              │
│  │  [📄 View Full Report]     │                   │
│  ├── Inventory ───────────────┤                   │
│  │  Total Value: ₵230,450                          │
│  │  Low Stock Items: 12                            │
│  │  Expiring Next 30 Days: 5                       │
│  │  [📄 View Full Report]     │                   │
│  └────────────────────────────┘                   │
│                                                    │
│  [📥 Export All as CSV]  [🖨 Print Summary]        │
└────────────────────────────────────────────────────┘
```

---

### 4.6 Settings Flow (Admin)

```
/admin/settings
      │
      ▼
┌────────────────────────────────────────────────────┐
│  SYSTEM SETTINGS                                   │
│                                                    │
│  ┌─ Store Information ──────────────────────────┐  │
│  │  Name:    [Pharmacy POS             ]        │  │
│  │  Address: [123 Main St              ]        │  │
│  │  Phone:   [555-0100                 ]        │  │
│  │  Email:   [info@pharmacy.com        ]        │  │
│  │  Currency:[₵ Ghanaian Cedi ▼       ]        │  │
│  │  [💾 Save]                                   │  │
│  ├── Tax Configuration ────────────────────────┤  │
│  │  Tax Rate: [10] %                            │  │
│  │  Tax Name: [VAT                     ]        │  │
│  │  Tax Included in Price: [Yes ▼]              │  │
│  │  [💾 Save]                                   │  │
│  ├── Receipt Template ─────────────────────────┤  │
│  │  Header Text: ______________________________ │  │
│  │  Footer Text: Thank you for your purchase!   │  │
│  │  Show barcode: [✔]  Show logo: [☐]          │  │
│  │  [💾 Save]                                   │  │
│  ├── Backup & Restore ─────────────────────────┤  │
│  │  Last backup: 10 Jun 2026                   │  │
│  │  [💾 Backup Now]  [📂 Restore from Backup]  │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 5. Shared Components (used across flows)

| Component | Where Used | Purpose |
|-----------|-----------|---------|
| `POS Terminal` | `/pos`, `/admin/pos` | Core sale processing |
| `Product Picker` | POS, Returns | Search/select products (modal) |
| `Payment Modal` | POS | Process payment (cash/card/mobile) |
| `Receipt View` | Sale detail, POS complete | Print/email receipt |
| `Product Card` | POS, Inventory | Display product info |
| `Stat Card` | Dashboards | KPI display |
| `Data Table` | Sales, Inventory, Users, Reports | Tabular data |
| `Search Bar` | All list views | Filter/search |
| `Sync Indicator` | Global | Show sync status |
| `Connectivity Banner` | Global | Offline warning |
| `Confirm Dialog` | Deletes, destructive actions | Confirmation |

---

## 6. Navigation & Layout by Context

```
── Sales Attendant Layout ──
┌──────────────────────────────────────────────┐
│  Navbar: [Logo] [Search] [Name] [Online ●]  │
├──────────┬───────────────────────────────────┤
│ Sidebar  │  Content area (Routes)            │
│ (w-56)   │                                    │
│          │  (no footer, full-height scroll)   │
└──────────┴────────────────────────────────────┘

── Admin Layout ──
┌──────────────────────────────────────────────┐
│  Navbar: [Logo] [Search] [Name] [Online ●]  │
├──────────┬───────────────────────────────────┤
│ Sidebar  │  Content area (Routes)            │
│ (w-56)   │                                    │
│ (Admin   │  Breadcrumb: Dashboard > Reports   │
│  nav)    │                                    │
└──────────┴────────────────────────────────────┘

── Auth Layout (Login/Register) ──
┌──────────────────────────────────────────────┐
│                                              │
│         Split-panel centered layout          │
│         No sidebar, no navbar                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 7. Auth Flow Diagram

```
                  ┌────────────────────┐
                  │  Initial Request   │
                  │  to any protected  │
                  │  route             │
                  └─────────┬──────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Authenticated? │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │ No                        │ Yes
              ▼                           ▼
       ┌──────────────┐           ┌───────────────┐
       │  Redirect to  │           │  Check Role    │
       │  /login        │           └───────┬───────┘
       └──────┬───────┘                     │
              │                     ┌───────┴────────┐
              │                     │ Admin?         │
              ▼                     └───────┬────────┘
        ┌──────────────┐           ┌────────┴────────┐
        │ User enters   │           │ Yes            │ No
        │ credentials   │           ▼                ▼
        └──────┬───────┘    ┌──────────────┐  ┌──────────────┐
               │            │ Redirect to   │  │ Redirect to   │
               ▼            │ /admin/       │  │ /pos          │
        ┌──────────────┐    │ dashboard     │  │ (POS Terminal)│
        │ Authenticate  │    └──────────────┘  └──────────────┘
        └──────┬───────┘
               │
        ┌──────┴──────┐
        │ Valid?      │
        └──────┬──────┘
     ┌─────────┴─────────┐
     │ No                │ Yes
     ▼                   ▼
┌──────────┐     ┌──────────────┐
│ Show     │     │ Store token  │
│ Error    │     │ & redirect   │
└──────────┘     │ per role     │
                 └──────────────┘
```

---

## 8. Screen/Route Summary Table

| Route | Screen | Role | Purpose |
|-------|--------|------|---------|
| `/login` | Login | All | Authentication |
| `/register` | Register | All | New account (with admin code) |
| `/` | Root | All | Redirect per role |
| `/pos` | POS Terminal | Sales, Admin | Core sale processing |
| `/sales` | Sales History | Sales, Admin | View past transactions |
| `/sales/:id` | Sale Detail | Sales, Admin | View receipt, reprint |
| `/returns` | Process Return | Sales, Admin | Find sale and return items |
| `/returns/:saleId` | Return from Sale | Sales, Admin | Return from specific sale |
| `/dashboard` | Sales Attendant Dashboard | Sales | Personal stats, quick actions |
| `/profile` | My Account | Sales | Password, personal info |
| `/admin/dashboard` | Admin Dashboard | Admin | Full business overview |
| `/admin/pos` | POS Terminal | Admin | Step in for sales |
| `/admin/sales` | All Sales | Admin | View all transactions |
| `/admin/sales/:id` | Sale Detail | Admin | View any receipt |
| `/admin/returns` | Returns | Admin | Process returns |
| `/admin/returns/:saleId` | Return from Sale | Admin | Return from specific sale |
| `/admin/inventory` | Inventory Management | Admin | Full product CRUD |
| `/admin/inventory/new` | Add Product | Admin | Create new product |
| `/admin/inventory/:id/edit` | Edit Product | Admin | Modify product |
| `/admin/inventory/import` | Bulk Import | Admin | CSV upload |
| `/admin/inventory/adjust` | Stock Adjustment | Admin | Manual stock correction |
| `/admin/users` | User Management | Admin | List all users |
| `/admin/users/new` | Register Attendant | Admin | Create sales account |
| `/admin/users/:id/edit` | Edit User | Admin | Modify user details |
| `/admin/reports` | Reports Dashboard | Admin | Report overview |
| `/admin/reports/sales` | Sales Reports | Admin | Detailed sales analytics |
| `/admin/reports/products` | Top Products | Admin | Best/worst performers |
| `/admin/reports/inventory` | Inventory Valuation | Admin | Stock value report |
| `/admin/reports/activity` | Activity Log | Admin | User audit trail |
| `/admin/settings` | Settings | Admin | System configuration |
| `/admin/settings/store` | Store Info | Admin | Business details |
| `/admin/settings/tax` | Tax Config | Admin | Tax rate setup |
| `/admin/settings/receipt` | Receipt Template | Admin | Receipt customization |
| `/admin/settings/backup` | Backup & Restore | Admin | Data backup |

---

## 9. Key Design Principles for Implementation

1. **POS is the priority** — Sales attendants land on `/pos` immediately, not a dashboard
2. **Admin gets overview first** — Admins land on `/admin/dashboard` with key metrics
3. **Minimal clicks to checkout** — From product search → add to cart → pay → receipt in ≤4 taps
4. **Offline resilience** — Every screen works offline; sync happens transparently
5. **Role-based routing** — Shared routes (`/pos`, `/sales`) render same components but with permission gates
6. **No dead ends** — Every screen has a clear next action and back navigation
7. **Inventory is read-only for sales** — Attendants can look up stock/prices but never modify
8. **Flat routes for sales, nested for admin** — Sales routes are flat (`/pos`, `/sales`); admin routes are nested (`/admin/inventory/new`) reflecting their hierarchical view
