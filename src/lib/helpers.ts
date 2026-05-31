import { CURRENT_YEAR, CURRENT_MONTH, MONTHS } from './constants';

export function monthLabel(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month);
}

export function parsePeriod(
  raw: string | null,
  fallback?: { year: number; month: number }
): { year: number; month: number } {
  if (raw) {
    const parts = raw.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      return { year: y, month: m };
    }
  }
  if (fallback) return fallback;
  return { year: CURRENT_YEAR, month: CURRENT_MONTH };
}

export function periodParam(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}
