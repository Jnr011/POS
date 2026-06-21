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

const COL_NAME = 26;
const COL_QTY = 6;
const COL_TOTAL = 16;

export function buildReceiptElements(sale: Sale, storeInfo?: ReceiptStoreInfo): ReceiptElement[] {
  const W = COL_NAME + COL_QTY + COL_TOTAL;

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
    { text: `₵${(item.price * item.quantity).toFixed(2)}`.padStart(COL_TOTAL) },
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

    { type: 'table', rows: saleBody, header: [{ text: 'Item' }, { text: 'Qty' }, { text: 'Total' }], columnWidths: [COL_NAME, COL_QTY, COL_TOTAL] },
    { type: 'line', char: '-' },

    { type: 'text', text: `Subtotal:${''.padStart(W - 9 - sale.total_price.toFixed(2).length)}₵${sale.total_price.toFixed(2)}`, align: 'right' },
    { type: 'text', text: `Tax:${''.padStart(W - 4 - sale.tax.toFixed(2).length)}₵${sale.tax.toFixed(2)}`, align: 'right' },
    { type: 'text', text: '' },
    { type: 'text', text: `TOTAL:  ₵${sale.grand_total.toFixed(2)}`, align: 'right', bold: true, size: 'double' },
    { type: 'text', text: '' },

    { type: 'text', text: `Payment: ${paymentMethod}`, bold: true },
    { type: 'text', text: `Tendered: ₵${sale.amount_tendered.toFixed(2)}` },
    { type: 'text', text: `Change:   ₵${sale.change_due.toFixed(2)}` },
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
