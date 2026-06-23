import type { Sale } from '../types';

export type ReceiptElement =
  | { type: 'title'; text: string }
  | { type: 'subtitle'; text: string }
  | { type: 'line'; char?: string }
  | { type: 'text'; text: string; align?: 'left' | 'center' | 'right'; bold?: boolean; size?: 'normal' | 'double' }
  | { type: 'table'; rows: { text: string }[][]; header?: { text: string }[]; columnWidths?: number[] }
  | { type: 'feed'; lines: number }
  | { type: 'cut' };

export interface ReceiptStoreInfo {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

const CURRENCY = 'GHS';

function fmt(amount: number): string {
  return `${CURRENCY} ${amount.toFixed(2)}`;
}

const W = 48;
const COL_NAME = 26;
const COL_QTY = 6;
const COL_TOTAL = 16;

function padLine(left: string, right: string): string {
  const gap = W - left.length - right.length;
  if (gap >= 1) {
    return left + ' '.repeat(gap) + right;
  }
  const maxLeft = W - right.length - 1;
  return left.slice(0, Math.max(0, maxLeft)) + ' ' + right;
}

export function buildReceiptElements(sale: Sale, storeInfo?: ReceiptStoreInfo): ReceiptElement[] {
  const storeName = storeInfo?.storeName || 'Pharmacy POS';
  const storeAddress = storeInfo?.storeAddress || '';
  const storePhone = storeInfo?.storePhone || '';
  const receiptHeader = storeInfo?.receiptHeader || '';
  const receiptFooter = storeInfo?.receiptFooter || 'Thank you for your purchase!';

  const paymentMethod =
    sale.payment_method === 'cash'
      ? 'Cash'
      : sale.payment_method === 'card'
        ? 'Card'
        : 'Mobile Money';

  const saleBody = (sale.items || []).map((item) => [
    { text: item.name.substring(0, COL_NAME) },
    { text: String(item.quantity).padStart(COL_QTY) },
    { text: fmt(item.price * item.quantity).padStart(COL_TOTAL) },
  ]);

  const elements: ReceiptElement[] = [
    { type: 'title', text: storeName },
    ...(storeAddress ? [{ type: 'text' as const, text: storeAddress, align: 'center' as const }] : []),
    ...(storePhone ? [{ type: 'text' as const, text: storePhone, align: 'center' as const }] : []),
    { type: 'line', char: '=' },
    { type: 'text', text: `Receipt #: ${sale.id}` },
    { type: 'text', text: `Date: ${new Date(sale.date).toLocaleString()}` },
    { type: 'text', text: `Cashier ID: ${sale.user_id}` },
    { type: 'text', text: '' },
    { type: 'line', char: '-' },

    ...(receiptHeader ? [{ type: 'text' as const, text: receiptHeader, align: 'center' as const }] : []),

    { type: 'text', text: 'Item'.padEnd(COL_NAME) + 'Qty'.padStart(COL_QTY) + 'Total'.padStart(COL_TOTAL) },
    { type: 'table', rows: saleBody, columnWidths: [COL_NAME, COL_QTY, COL_TOTAL] },
    { type: 'line', char: '-' },

    { type: 'text', text: padLine('Subtotal:', fmt(sale.total_price)) },
    { type: 'text', text: padLine('Tax:', fmt(sale.tax)) },
    { type: 'text', text: '' },
    { type: 'text', text: `  ${fmt(sale.grand_total)}`, align: 'center', bold: true, size: 'double' },
    { type: 'text', text: '' },

    { type: 'text', text: `Payment: ${paymentMethod}`, bold: true },
    { type: 'text', text: padLine('Tendered:', fmt(sale.amount_tendered)) },
    { type: 'text', text: padLine('Change:', fmt(sale.change_due)) },
    { type: 'text', text: '' },

    { type: 'line', char: '=' },

    { type: 'text', text: storeName, align: 'center', bold: true },
    ...(storeAddress ? [{ type: 'text' as const, text: storeAddress, align: 'center' as const }] : []),
    ...(storePhone ? [{ type: 'text' as const, text: storePhone, align: 'center' as const }] : []),

    { type: 'text', text: receiptFooter, align: 'center' },
    { type: 'text', text: '' },
  ];

  elements.push({ type: 'feed', lines: 3 }, { type: 'cut' });

  return elements;
}
