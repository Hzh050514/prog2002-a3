/**
 * Small formatting helpers shared by the client pages.
 * Kept in one file so every page formats money and dates identically.
 */

import { CharityEvent } from './models';

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

/** "50000" -> "$50,000" */
export function formatCurrency(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return '$0';
  }
  return AUD.format(amount);
}

/**
 * Render a MySQL DATE or DATETIME value.
 * Date-only strings are parsed as LOCAL dates, otherwise a UTC date string
 * would be shifted one day backwards in some time zones.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** "2026-09-02 09:15:00" -> "02 Sep 2026, 09:15" */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return `${parsed.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}, ${parsed.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Percentage of the funding target already raised (0 - 100). */
export function fundingProgress(event: CharityEvent): number {
  const target = Number(event.target_funding ?? 0);
  const current = Number(event.current_funding ?? 0);
  if (!target || target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / target) * 100));
}

/** Maps an event status to its badge CSS class. */
export function statusClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'badge badge-active';
    case 'Suspended':
      return 'badge badge-suspended';
    default:
      return 'badge badge-past';
  }
}
