import { db } from './index';

const RELAY_URL = 'http://localhost:5000/api/sync';

const DEMO_PRODUCTS = [
  { name: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.99, stock_quantity: 100, expiry_date: '2026-12-31', min_stock: 20, supplier: 'PharmaDist Co.' },
  { name: 'Aspirin 100mg', category: 'Pain Relief', price: 3.50, stock_quantity: 8, expiry_date: '2026-11-15', min_stock: 20, supplier: 'PharmaDist Co.' },
  { name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 4.99, stock_quantity: 75, expiry_date: '2026-10-01', min_stock: 15, supplier: 'MedSupply Ltd.' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotics', price: 12.00, stock_quantity: 50, expiry_date: '2026-09-15', min_stock: 10, supplier: 'MedSupply Ltd.' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', price: 15.00, stock_quantity: 0, expiry_date: '2027-01-01', min_stock: 10, supplier: 'MedSupply Ltd.' },
  { name: 'Vitamin C 1000mg', category: 'Supplements', price: 8.99, stock_quantity: 60, expiry_date: '2027-06-30', min_stock: 15, supplier: 'HealthVita Inc.' },
  { name: 'Vitamin D3 2000IU', category: 'Supplements', price: 7.49, stock_quantity: 45, expiry_date: '2027-05-15', min_stock: 15, supplier: 'HealthVita Inc.' },
  { name: 'Omega-3 Fish Oil', category: 'Supplements', price: 14.99, stock_quantity: 30, expiry_date: '2026-08-20', min_stock: 10, supplier: 'HealthVita Inc.' },
  { name: 'Antibiotic Cream', category: 'Topical', price: 2.99, stock_quantity: 25, expiry_date: '2026-06-30', min_stock: 10, supplier: 'TopiCare Labs' },
  { name: 'Hydrocortisone Cream', category: 'Topical', price: 4.50, stock_quantity: 20, expiry_date: '2026-12-01', min_stock: 10, supplier: 'TopiCare Labs' },
  { name: 'Cough Syrup DM', category: 'Cough & Cold', price: 6.99, stock_quantity: 40, expiry_date: '2026-09-01', min_stock: 10, supplier: 'Relief Pharma' },
  { name: 'Antihistamine 10mg', category: 'Allergies', price: 5.49, stock_quantity: 55, expiry_date: '2027-03-01', min_stock: 15, supplier: 'Relief Pharma' },
  { name: 'Bandages Assorted', category: 'First Aid', price: 3.99, stock_quantity: 10, expiry_date: null, min_stock: 20, supplier: 'SafeCare Inc.' },
  { name: 'Digital Thermometer', category: 'Medical Devices', price: 12.99, stock_quantity: 15, expiry_date: null, min_stock: 5, supplier: 'MedEquip Corp.' },
  { name: 'Blood Pressure Monitor', category: 'Medical Devices', price: 45.00, stock_quantity: 7, expiry_date: null, min_stock: 3, supplier: 'MedEquip Corp.' },
];

let _seeding = false;

async function deviceId(): Promise<string> {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'pos-' + crypto.randomUUID().slice(0, 8);
    localStorage.setItem('deviceId', id);
  }
  return id;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'pharmacy-pos-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hasData(): Promise<boolean> {
  const admin = await db.users.filter(u => u.role === 'admin').count();
  const products = await db.products.count();
  return admin > 0 && products > 0;
}

export async function seedDatabase(): Promise<void> {
  if (_seeding) return;
  if (await hasData()) return;

  _seeding = true;
  try {
    const did = await deviceId();
    const now = Date.now();

    if (await db.products.count() === 0) {
      await db.products.bulkAdd(
        DEMO_PRODUCTS.map(p => ({
          ...p,
          updatedAt: now,
          syncStatus: 'synced' as const,
          deviceId: did,
        })) as any
      );
    }

    const existingAdmin = await db.users.filter(u => u.email === 'admin@pharmacy.com').first();
    if (!existingAdmin) {
      await db.users.add({
        name: 'Admin',
        email: 'admin@pharmacy.com',
        role: 'admin',
        pinHash: await hashPin('12345'),
        isActive: true,
        updatedAt: now,
        syncStatus: 'synced',
        deviceId: did,
      } as any);
    }

    const existingSales = await db.users.filter(u => u.email === 'john@pharmacy.com').first();
    if (!existingSales) {
      await db.users.add({
        name: 'John Doe',
        email: 'john@pharmacy.com',
        role: 'sales',
        pinHash: await hashPin('56789'),
        isActive: true,
        updatedAt: now,
        syncStatus: 'synced',
        deviceId: did,
      } as any);
    }

    await Promise.all([
      db.storeInfo.put({ key: 'storeName', value: 'Pharmacy POS' }),
      db.storeInfo.put({ key: 'storeAddress', value: '123 Main Street' }),
      db.storeInfo.put({ key: 'storePhone', value: '555-0100' }),
      db.storeInfo.put({ key: 'storeEmail', value: 'info@pharmacy.com' }),
      db.storeInfo.put({ key: 'taxRate', value: '10' }),
      db.storeInfo.put({ key: 'currency', value: 'GHS' }),
      db.storeInfo.put({ key: 'currencySymbol', value: '₵' }),
      db.syncMeta.put({ tableName: 'products', lastSyncedAt: now, lastSyncStatus: 'success' }),
      db.syncMeta.put({ tableName: 'sales', lastSyncedAt: now, lastSyncStatus: 'success' }),
      db.syncMeta.put({ tableName: 'users', lastSyncedAt: now, lastSyncStatus: 'success' }),
    ]);
  } finally {
    _seeding = false;
  }
}

export async function resetDevDatabase(): Promise<void> {
  console.log('[DevReset] Wiping local IndexedDB...');
  await db.transaction(
    'rw',
    db.products,
    db.sales,
    db.users,
    db.syncQueue,
    db.syncMeta,
    db.storeInfo,
    db.stockAdjustments,
    db.activityLog,
    db.printJobs,
    async () => {
      await Promise.all([
        db.products.clear(),
        db.sales.clear(),
        db.users.clear(),
        db.syncQueue.clear(),
        db.syncMeta.clear(),
        db.storeInfo.clear(),
        db.stockAdjustments.clear(),
        db.activityLog.clear(),
        db.printJobs.clear(),
      ]);
    }
  );

  localStorage.removeItem('authUser');
  localStorage.removeItem('deviceId');
  localStorage.removeItem('heldSales');

  console.log('[DevReset] Wiping relay server...');
  try {
    const res = await fetch(`${RELAY_URL}/reset`, { method: 'POST' });
    if (res.ok) {
      console.log('[DevReset] Server wiped');
    } else {
      console.warn('[DevReset] Server wipe failed:', res.status);
    }
  } catch {
    console.warn('[DevReset] Server not reachable — continuing offline');
  }

  console.log('[DevReset] Re-seeding fresh data...');
  await seedDatabase();
  console.log('[DevReset] Done — reloading...');
  window.location.reload();
}
