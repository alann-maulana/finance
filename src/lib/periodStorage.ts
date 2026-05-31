/**
 * periodStorage.ts
 *
 * Utility to persist and restore the user's last-selected period
 * (bulan + tahun) across pages via localStorage.
 *
 * Rules:
 * - Only the filter dropdowns on dashboard, cash-out, and report pages
 *   should SAVE to storage.
 * - The cash-in page reads only `tahun` from storage.
 * - Form dropdowns (add cash-in / add cash-out) must NEVER write to storage.
 */

import { CURRENT_MONTH, CURRENT_YEAR } from './constants';

const STORAGE_KEY = 'finance_selected_period';

interface StoredPeriod {
  bulan: number;
  tahun: number;
}

/** Save selected period to localStorage (call only from filter dropdowns). */
export function savePeriod(tahun: number, bulan: number): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredPeriod = { bulan, tahun };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be unavailable (private mode, storage full, etc.)
  }
}

/** Read stored period. Falls back to current month/year if not set. */
export function loadPeriod(): StoredPeriod {
  if (typeof window === 'undefined') {
    return { bulan: CURRENT_MONTH, tahun: CURRENT_YEAR };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPeriod;
      const { bulan, tahun } = parsed;
      if (
        typeof tahun === 'number' &&
        typeof bulan === 'number' &&
        bulan >= 1 &&
        bulan <= 12
      ) {
        return { bulan, tahun };
      }
    }
  } catch {
    // malformed JSON or unavailable storage
  }
  return { bulan: CURRENT_MONTH, tahun: CURRENT_YEAR };
}

/**
 * Load stored period as { year, month } for use with parsePeriod().
 * This converts the internal storage shape (bulan/tahun) to the shape
 * that parsePeriod expects.
 */
export function loadPeriodAsFallback(): { year: number; month: number } {
  const { bulan, tahun } = loadPeriod();
  return { year: tahun, month: bulan };
}

/** Convenience: load only the `tahun` field (for cash-in page). */
export function loadPeriodYear(): number {
  return loadPeriod().tahun;
}
