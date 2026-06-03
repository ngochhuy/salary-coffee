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
export function getCachedSchedule(): ParsedSchedule | null {
  return getStorageItem<ParsedSchedule | null>(STORAGE_KEYS.SHEET_DATA, null);
}

/**
 * Save schedule data to localStorage
 */
export function setCachedSchedule(schedule: ParsedSchedule): void {
  setStorageItem(STORAGE_KEYS.SHEET_DATA, schedule);
}

/**
 * Get last fetch timestamp
 */
export function getLastFetch(): Date | null {
  const timestamp = getStorageItem<string | null>(STORAGE_KEYS.LAST_FETCH, null);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Update last fetch timestamp
 */
export function updateLastFetch(): void {
  setStorageItem(STORAGE_KEYS.LAST_FETCH, new Date().toISOString());
}

/**
 * Clear all cached data (for refresh)
 */
export function clearCachedData(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEYS.SHEET_DATA);
    window.localStorage.removeItem(STORAGE_KEYS.LAST_FETCH);
  }
}

// ==================== DEBUG FILE LOADING (DEV ONLY) ====================

/**
 * Load schedule from debug file (public/data/schedule.json)
 * Only works in development mode
 */
export async function loadScheduleFromDebugFile(): Promise<ParsedSchedule | null> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ Debug file loading only works in development mode');
    return null;
  }

  try {
    const response = await fetch('/data/schedule.json');
    if (!response.ok) {
      console.warn('⚠️ Debug file not found. Fetch from API first.');
      return null;
    }

    const data = await response.json();
    console.log('✅ Loaded from debug file:', data);

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
