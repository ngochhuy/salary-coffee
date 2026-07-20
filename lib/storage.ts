import { EmployeeWage, ParsedSchedule, STORAGE_KEYS } from '@/types';

/**
 * Safely get item from localStorage
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 */
function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

// ==================== WAGES ====================

/**
 * Get employee wages from localStorage
 */
export function getWages(): EmployeeWage[] {
  return getStorageItem<EmployeeWage[]>(STORAGE_KEYS.WAGES, []);
}

/**
 * Save employee wages to localStorage
 */
export function setWages(wages: EmployeeWage[]): void {
  setStorageItem(STORAGE_KEYS.WAGES, wages);
}

/**
 * Update or add a single employee's wage
 */
export function updateWage(employeeName: string, hourlyWage: number): void {
  const wages = getWages();
  const existingIndex = wages.findIndex((w) => w.employeeName === employeeName);

  if (existingIndex >= 0) {
    wages[existingIndex].hourlyWage = hourlyWage;
  } else {
    wages.push({ employeeName, hourlyWage });
  }

  setWages(wages);
}

// ==================== SCHEDULE DATA CACHE ====================

/**
 * Get cached schedule data from localStorage
 */
export function getCachedSchedule(sheetId?: string): ParsedSchedule | null {
  const key = sheetId ? `${STORAGE_KEYS.SHEET_DATA}-${sheetId}` : STORAGE_KEYS.SHEET_DATA;
  return getStorageItem<ParsedSchedule | null>(key, null);
}

/**
 * Save schedule data to localStorage
 */
export function setCachedSchedule(schedule: ParsedSchedule, sheetId?: string): void {
  const key = sheetId ? `${STORAGE_KEYS.SHEET_DATA}-${sheetId}` : STORAGE_KEYS.SHEET_DATA;
  setStorageItem(key, schedule);
}

/**
 * Get last fetch timestamp
 */
export function getLastFetch(sheetId?: string): Date | null {
  const key = sheetId ? `${STORAGE_KEYS.LAST_FETCH}-${sheetId}` : STORAGE_KEYS.LAST_FETCH;
  const timestamp = getStorageItem<string | null>(key, null);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Update last fetch timestamp
 */
export function updateLastFetch(sheetId?: string): void {
  const key = sheetId ? `${STORAGE_KEYS.LAST_FETCH}-${sheetId}` : STORAGE_KEYS.LAST_FETCH;
  setStorageItem(key, new Date().toISOString());
}

/**
 * Clear all cached data (for refresh)
 */
export function clearCachedData(sheetId?: string): void {
  if (typeof window !== 'undefined') {
    const dataKey = sheetId ? `${STORAGE_KEYS.SHEET_DATA}-${sheetId}` : STORAGE_KEYS.SHEET_DATA;
    const fetchKey = sheetId ? `${STORAGE_KEYS.LAST_FETCH}-${sheetId}` : STORAGE_KEYS.LAST_FETCH;
    window.localStorage.removeItem(dataKey);
    window.localStorage.removeItem(fetchKey);
  }
}

// ==================== DEBUG FILE LOADING (DEV ONLY) ====================

/**
 * Load schedule from debug file (public/data/schedule.json or public/data/schedule-[sheetId].json)
 * Only works in development mode
 */
export async function loadScheduleFromDebugFile(sheetId?: string): Promise<ParsedSchedule | null> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ Debug file loading only works in development mode');
    return null;
  }

  try {
    let response;
    if (sheetId) {
      response = await fetch(`/data/schedule-${sheetId}.json`);
      if (!response.ok) {
        // Do not fall back to schedule.json for sheet-specific lookups
        return null;
      }
    } else {
      response = await fetch('/data/schedule.json');
      if (!response.ok) {
        console.warn('⚠️ Debug file not found. Fetch from API first.');
        return null;
      }
    }

    const data = await response.json();
    console.log(`✅ Loaded from debug file (${sheetId || 'default'}):`, data);

    // Handle both formats: direct schedule or wrapped in { combinedSchedule }
    if (data.combinedSchedule) {
      return data.combinedSchedule;
    }
    return data;
  } catch (err) {
    console.warn('⚠️ Failed to load debug file:', err);
    return null;
  }
}

