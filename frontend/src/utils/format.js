const pad = (n) => String(n).padStart(2, '0');

/** Today's date in the user's own timezone as YYYY-MM-DD */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Adds days to a YYYY-MM-DD string */
export function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Backend dates are midnight UTC, so slicing the ISO string gives the calendar day */
export const toInputDate = (iso) => (iso ? String(iso).slice(0, 10) : '');

export function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { timeZone: 'UTC', ...options });
}

export const formatShortDate = (iso) => formatDate(iso, { day: 'numeric', month: 'short' });

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export function daysUntil(iso) {
  const target = new Date(iso).getTime();
  const [y, m, d] = todayStr().split('-').map(Number);
  return Math.round((target - Date.UTC(y, m - 1, d)) / 86400000);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Converts form strings to numbers for the API; empty stays null */
export const toNumberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
