# 🔐 Role-Based Dashboard System - Quick Guide

## System Overview

Your POS system now has **two different dashboards** based on user roles:
- **Admin Dashboard** - Full system management
- **Sales Rep Dashboard** - Sales-focused interface

---

## 🚀 Quick Start

### Login as Admin (Default)

**Email**: `admin@pharmacy.com`  
**Password**: `admin@123`

✅ You'll see the **Admin Dashboard** with:
- 📊 Total Products
- ⚠️ Low Stock Alerts  
- 💰 Inventory Value
- 👥 Total Users
- 💵 Revenue Stats
- 📈 Registration Code display

### Create a Sales Rep Account

1. **Login as Admin** first
2. Go to **Login page** (click the user icon in navbar)
3. Click **"Register (Admin Only)"** button
4. Fill in:
   - **Sales Rep Name**: e.g., "John Doe"
   - **Admin Registration Code**: `ADMIN2024`
   - **Email**: e.g., "john@pharmacy.com"
   - **Password**: Any password
5. Click **Register** → "Registration successful!"

### Login as Sales Rep

1. Go back to login page
2. Use the email and password you just created
3. Click **Login**
4. You'll see the **Sales Rep Dashboard** with:
   - 📊 Today's Sales
   - 🔢 Sales Transactions
   - 📦 Products Available
   - 💰 Commission Calculator (5%)
   - 📈 Recent Sales History
   - ⚡ Quick Action Links

---

## 📋 What Each Role Can Access

### Admin Can:
✅ View Admin Dashboard  
✅ View all Inventory  
✅ View all Sales records  
✅ View Reports (admin only)  
✅ Register new Sales Reps  
✅ View system statistics  

### Sales Rep Can:
✅ View Sales Rep Dashboard  
✅ Record new sales  
✅ View available Inventory  
✅ See their sales history  
✅ Track commission earnings  
❌ Cannot register other users  
❌ Cannot access reports  

---

## 🔐 Registration Code System

**Why Admin Code?**
- Only admins can register new sales reps
- Prevents unauthorized user creation
- Maintains system security

**The Code**: `ADMIN2024`
- Share this with admins who need to register sales reps
- Can be changed in backend if needed

---

## 🎨 UI Changes

### Navigation Bar
- Shows user role (👨‍💼 Admin or 👤 Sales Rep)
- Different menu items per role
- Logout button

### Sidebar Menu
**For Admins**:
- 📊 Overview
- 💳 All Sales
- 📦 Inventory
- 📈 Reports
- 👥 Register Sales Rep (with code)

**For Sales Reps**:
- 📊 My Dashboard
- 💳 Record Sale
- 📦 Inventory
- (No Reports or Registration)

---

## 📊 Dashboard Comparison

### Admin Dashboard
```
┌─────────────┬──────────────┬──────────────┐
│   Products  │ Low Stock    │ Inv. Value   │
├─────────────┼──────────────┼──────────────┤
│   Total $   │ Total Users  │ Total Rev.   │
└─────────────┴──────────────┴──────────────┘
+ Admin Actions Panel
+ Registration Code Display
```

### Sales Rep Dashboard
```
┌──────────────┬──────────────┬──────────────┐
│ Today's $    │ Transactions │ Products     │
├──────────────┼──────────────┼──────────────┤
│ Commission   │ Recent Sales │ Quick Action │
└──────────────┴──────────────┴──────────────┘
```

---

## 🔄 How It Works Behind the Scenes

1. **Login** → Backend checks credentials
2. **JWT Token** → Includes user role (admin/sales)
3. **Frontend Check** → Routes based on role
4. **Dashboard Selection** → Admin or Sales Rep dashboard loads
5. **Menu Items** → Sidebar shows role-specific options
6. **API Calls** → Frontend requests match user permissions

---

## ✅ Testing Checklist

- [ ] Login as admin@pharmacy.com
- [ ] See Admin Dashboard with all stats
- [ ] Click "Register (Admin Only)"
- [ ] Register a new sales rep with code ADMIN2024
- [ ] Logout as admin
- [ ] Login as the new sales rep
- [ ] See Sales Rep Dashboard (different layout)
- [ ] Try accessing Reports - should redirect to login
- [ ] Try going to /reports directly - blocked
- [ ] Verify commission calculation (5% on sales)

---

## 🛠️ Technical Details

**Backend Changes**:
- Auth controller validates registration code
- Only 'sales' role created via registration endpoint
- Admin role only created during initialization

**Frontend Changes**:
- App.js checks user.role from localStorage
- Routes protected by role verification
- DashboardRoute component selects correct dashboard
- Sidebar component shows conditional menu items

**Database**:
- Initial Admin created automatically on startup
- Each user has role field (admin/sales)
- Sales can only be recorded, not viewed across system

---

## 📝 Notes

- Registration code is `ADMIN2024` - share with trusted admins only
- Admin email/password: admin@pharmacy.com / admin@123
- Each sales rep has their own sales history
- Commission is calculated as 5% on their sales
- Admin can see all sales system-wide

---

**Setup Complete!** Your role-based POS system is ready to use! 🎉
