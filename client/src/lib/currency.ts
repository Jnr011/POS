/**
 * Currency formatting utility.
 * Default: Ghana Cedi (GHS / ₵)
 *
 * Usage:
 *   import { formatCurrency } from '@/lib/currency';
 *   formatCurrency(1234.5) → "₵1,234.50"
 *
 * For cases that need just the symbol:
 *   import { CURRENCY_SYMBOL } from '@/lib/currency';
 *   <span>{CURRENCY_SYMBOL}{amount.toFixed(2)}</span>
 */

export const CURRENCY_CODE = 'GHS';
export const CURRENCY_SYMBOL = '₵';

export interface CurrencyOptions {
  /** Override the default currency symbol */
  symbol?: string;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Show currency code after symbol, e.g. "₵123.45 GHS" */
  showCode?: boolean;
}

/**
 * Format a number as currency.
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: CurrencyOptions = {},
): string {
  if (amount == null || !Number.isFinite(amount)) return '—';

  const { symbol = CURRENCY_SYMBOL, decimals = 2, showCode = false } = options;
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const result = `${symbol}${amount < 0 ? '-' : ''}${formatted}`;
  return showCode ? `${result} ${CURRENCY_CODE}` : result;
}
