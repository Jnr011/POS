import type { Product } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const THIRTY_DAYS = 30 * 86_400_000;

const ADJUST_REASONS = [
  'Received shipment', 'Sold', 'Damaged',
  'Expired', 'Returned by customer', 'Correction', 'Other',
];

// ─── Stock adjust log ─────────────────────────────────────────────────────────

interface StockAdjustLog {
  productId: number;
  productName: string;
  previousQty: number;
  newQty: number;
  delta: number;
  reason: string;
  timestamp: number;
}

function getStockLog(): StockAdjustLog[] {
  try { return JSON.parse(localStorage.getItem('stockAdjustLog') || '[]'); }
  catch { return []; }
}

function appendStockLog(entry: StockAdjustLog) {
  const log = getStockLog();
  log.unshift(entry);
  if (log.length > 200) log.length = 200;
  localStorage.setItem('stockAdjustLog', JSON.stringify(log));
}

// ─── Row styling ──────────────────────────────────────────────────────────────

function rowClass(
  product: Product,
  selectedIds: Set<number>,
  pendingStock?: Map<number, { original: number; newQty: number }>,
): string {
  const now = Date.now();
  const parts: string[] = ['transition-colors'];

  const expired = product.expiry_date && new Date(product.expiry_date).getTime() < now;
  const oos = product.stock_quantity === 0;
  const low = product.stock_quantity <= (product.min_stock ?? 10);
  const expiringSoon = !expired && product.expiry_date && (() => {
    const diff = new Date(product.expiry_date).getTime() - now;
    return diff > 0 && diff <= THIRTY_DAYS;
  })();
  const isPending = pendingStock?.has(product.id);

  // Priority: selected > pending > critical (oos/expired) > warning (low/expiring)
  if (selectedIds.has(product.id)) {
    parts.push('bg-primary/[0.06]');
  }

  if (isPending) {
    parts.push('bg-primary/[0.08]');
  } else if (oos || expired) {
    parts.push('bg-destructive/[0.06]');
  } else if (low) {
    parts.push('bg-amber-500/[0.06] dark:bg-amber-400/[0.04]');
  } else if (expiringSoon) {
    parts.push('bg-amber-500/[0.04] dark:bg-amber-400/[0.03]');
  }

  return parts.join(' ');
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

interface CsvProduct {
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  expiry_date: string | null;
}

function parseCSV(text: string): CsvProduct[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  for (const field of ['name', 'category', 'price', 'stock_quantity']) {
    if (!headers.includes(field)) throw new Error(`Missing required column: ${field}`);
  }

  return lines.slice(1).filter(l => l.trim()).map((line, i) => {
    const vals: Record<string, string> = {};
    line.split(',').forEach((v, idx) => { vals[headers[idx]] = v.trim(); });

    const price = parseFloat(vals.price);
    const stock = parseInt(vals.stock_quantity, 10);

    if (!vals.name || !vals.category) throw new Error(`Row ${i + 2}: missing name or category.`);
    if (isNaN(price) || price < 0) throw new Error(`Row ${i + 2}: invalid price.`);
    if (isNaN(stock) || stock < 0) throw new Error(`Row ${i + 2}: invalid stock.`);

    return {
      name: vals.name,
      category: vals.category,
      price,
      stock_quantity: stock,
      expiry_date: vals.expiry_date || null,
    };
  });
}

export {
  THIRTY_DAYS,
  ADJUST_REASONS,
  getStockLog,
  appendStockLog,
  rowClass,
  parseCSV,
};

export type { StockAdjustLog, CsvProduct };
