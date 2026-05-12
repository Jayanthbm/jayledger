import { format, parseISO } from 'date-fns';
import { APP_CONFIG } from '../constants';

/**
 * Formats a number as a currency string.
 * Uses APP_CONFIG for locale and currency symbol.
 *
 * @param amount - The number to format
 * @returns A formatted currency string (e.g., ₹1,234.56)
 */
export const formatCurrency = (amount: number): string => {
  const isInteger = amount % 1 === 0;
  const formattedAmount = Math.abs(amount).toLocaleString(APP_CONFIG.DEFAULT_LOCALE, {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${APP_CONFIG.CURRENCY_SYMBOL}${formattedAmount}`;
};

/**
 * Formats a date string or Date object.
 * Default format is 'MMM d, yyyy'.
 */
export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Formats a date for display in transaction sections (e.g., 'Today', 'Yesterday', or 'MMM d').
 */
export const formatTransactionDate = (dateStr: string): string => {
  const date = parseISO(dateStr);
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
};
