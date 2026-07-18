import type { DevExpenseV4 } from './types';

/**
 * Format a date string using the dynamic locale.
 * Never hardcodes fr-FR.
 */
export function formatDate(
  s: string | null | undefined,
  locale: string = 'fr',
): string {
  if (!s) return '—';
  try {
    const d = new Date(s.length === 10 ? s + 'T00:00:00Z' : s);
    return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: s.length === 10 ? 'UTC' : undefined,
    });
  } catch {
    return s;
  }
}

export function formatDateTime(
  s: string | null | undefined,
  locale: string = 'fr',
): string {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

export function formatMonth(
  s: string,
  locale: string = 'fr',
): string {
  try {
    const d = new Date(s + 'T00:00:00Z');
    return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return s;
  }
}

/**
 * Format a monetary amount with currency.
 * Never uses $ for USDT/USDC.
 * Always shows 2 decimal places.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'fr',
): string {
  const val = amount ?? 0;
  const localeStr = locale === 'fr' ? 'fr-FR' : 'en-US';

  if (currency === 'USD') {
    return val.toLocaleString(localeStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  }
  if (currency === 'EUR') {
    return val.toLocaleString(localeStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
  }
  // For crypto and other currencies, show as plain number + code
  return val.toLocaleString(localeStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

/**
 * Format multiple currency amounts (for stats display).
 * Returns array of formatted strings, one per currency.
 */
export function formatMultiCurrency(
  amounts: Record<string, number>,
  locale: string = 'fr',
): { currency: string; amount: string }[] {
  return Object.entries(amounts)
    .filter(([, v]) => v > 0)
    .map(([currency, amount]) => ({
      currency,
      amount: formatMoney(amount, currency, locale),
    }));
}

export function daysUntil(due: string | null | undefined): number | null {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due.length === 10 ? due + 'T00:00:00Z' : due);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(expense: DevExpenseV4): boolean {
  if (!expense.due_date) return false;
  if (['completed', 'cancelled', 'archived'].includes(expense.status_v4 ?? '')) return false;
  return daysUntil(expense.due_date) !== null && (daysUntil(expense.due_date) as number) < 0;
}

/**
 * Calculate the unvalidated portion:
 * max(requested_amount - approved_amount, 0) when approved_amount exists.
 */
export function getUnvalidatedAmount(expense: DevExpenseV4): number | null {
  if (expense.approved_amount == null) return null;
  const requested = expense.requested_amount ?? expense.invoice_amount ?? 0;
  return Math.max(requested - expense.approved_amount, 0);
}

/**
 * Get expected settlement amount using priority:
 * approved_amount → requested_amount → invoice_amount → amount_usd
 */
export function getExpectedSettlementAmount(expense: DevExpenseV4): number {
  return (
    expense.approved_amount ??
    expense.requested_amount ??
    expense.invoice_amount ??
    expense.amount_usd ??
    0
  );
}

export function getRemainingAmount(expense: DevExpenseV4): number {
  const expected = getExpectedSettlementAmount(expense);
  return Math.max(expected - (expense.settled_amount ?? 0), 0);
}
