// Standalone receipt builder test - run with: node scripts/test-receipt.mjs

const CURRENCY = 'GHS';
const fmt = (amount) => `${CURRENCY} ${amount.toFixed(2)}`;

const W = 48;
const COL_NAME = 26;
const COL_QTY = 6;
const COL_TOTAL = 16;

function padLine(left, right) {
  const gap = W - left.length - right.length;
  if (gap >= 1) return left + ' '.repeat(gap) + right;
  const maxLeft = W - right.length - 1;
  return left.slice(0, Math.max(0, maxLeft)) + ' ' + right;
}

function repeat(char, n) {
  return char.repeat(n);
}

function center(text, width) {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + ' '.repeat(pad - left);
}

const mockSale = {
  id: 1234,
  user_id: 1,
  items: [
    { id: 1, name: 'Paracetamol 500mg', price: 5.00, quantity: 2 },
    { id: 2, name: 'Amoxicillin 250mg', price: 12.50, quantity: 1 },
    { id: 3, name: 'Vitamin C 1000mg', price: 8.75, quantity: 3 },
    { id: 4, name: 'Ibuprofen 400mg', price: 7.50, quantity: 2 },
  ],
  total_price: 60.00,
  tax: 7.50,
  grand_total: 67.50,
  payment_method: 'cash',
  amount_tendered: 100.00,
  change_due: 32.50,
  date: '2026-06-23T15:30:00',
};

// Build receipt lines
const lines = [];

// Header
lines.push('');
lines.push(center('PHARMACY POS', W));
lines.push(center('123 Main Street, Accra', W));
lines.push(center('+233 55 123 4567', W));
lines.push(repeat('=', W));
lines.push(`Receipt #: ${mockSale.id}`);
lines.push(`Date: ${new Date(mockSale.date).toLocaleString()}`);
lines.push(`Cashier ID: ${mockSale.user_id}`);
lines.push('');
lines.push(repeat('-', W));

// Table header
const header = 'Item' + ' '.repeat(COL_NAME - 4) + 'Qty' + ' '.repeat(COL_QTY - 3) + 'Total' + ' '.repeat(COL_TOTAL - 5);
let rawHeader = 'Item'.padEnd(26) + 'Qty'.padStart(6) + 'Total'.padStart(16);
lines.push(rawHeader);

// Items
for (const item of mockSale.items) {
  const name = item.name.substring(0, COL_NAME);
  const qty = String(item.quantity).padStart(COL_QTY);
  const total = fmt(item.price * item.quantity).padStart(COL_TOTAL);
  lines.push(name + qty + total);
}

lines.push(repeat('-', W));

// Summary
lines.push(padLine('Subtotal:', fmt(mockSale.total_price)));
lines.push(padLine('Tax:', fmt(mockSale.tax)));
lines.push('');
lines.push(center(`  ${fmt(mockSale.grand_total)}`, W));
lines.push('');

// Payment
const method = 'Cash';
lines.push(`Payment: ${method}`);
lines.push(padLine('Tendered:', fmt(mockSale.amount_tendered)));
lines.push(padLine('Change:', fmt(mockSale.change_due)));
lines.push('');
lines.push(repeat('=', W));

// Footer
lines.push(center('PHARMACY POS', W));
lines.push(center('123 Main Street, Accra', W));
lines.push(center('+233 55 123 4567', W));
lines.push(center('Thank you for your purchase!', W));
lines.push('');

// Check for overflow
let maxLineLen = 0;
for (const line of lines) {
  if (line.length > maxLineLen) maxLineLen = line.length;
  const marker = line.length > W ? ' <<< OVERFLOW' : '';
  console.log('|' + line.padEnd(W) + '|' + marker);
}

// Visual width indicator
console.log('|' + '0'.repeat(10) + '1'.repeat(10) + '2'.repeat(10) + '3'.repeat(10) + '4'.repeat(8) + '|');
console.log('|' + '0'.repeat(10) + '1'.repeat(10) + '2'.repeat(10) + '3'.repeat(10) + '4'.repeat(8) + '| (max width = ' + W + ')');

if (maxLineLen > W) {
  console.log(`\n⚠ WARNING: ${maxLineLen - W} line(s) overflow the ${W}-char width!`);
} else {
  console.log(`\n✓ All ${lines.length} lines fit within ${W} characters.`);
}
