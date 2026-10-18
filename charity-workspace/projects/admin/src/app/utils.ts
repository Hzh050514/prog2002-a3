/** Formatting helpers shared by the admin pages. */

import { CharityEvent } from './models';

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isNaN(amount) ? '$0' : AUD.format(amount);
}

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
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

/** Converts a MySQL DATE value to the yyyy-MM-dd format an <input type="date"> needs. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return String(value).slice(0, 10);
}

export function fundingProgress(event: CharityEvent): number {
  const target = Number(event.target_funding ?? 0);
  const current = Number(event.current_funding ?? 0);
  if (!target || target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / target) * 100));
}
