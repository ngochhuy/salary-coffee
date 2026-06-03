# Phase 2: Core Logic

## Overview
Implement parsing, calculation, and storage logic that powers the application.

---

## 2.1 Type Definitions (`types/index.ts`)

### Implementation

```typescript
// Represents shift data for a single employee on a single day
export interface ShiftData {
  employee: string;
  shiftType: 'M-14h' | 'M' | 'N' | 'ca3' | 'custom' | null;
  customHours?: { start: number; end: number };
  date: string;
  // Column index within the day (0=Ca1, 1=Ca2, 2=Ca3)
  columnOffset: number;
  // Allowance for this shift (NEW)
  allowance?: number;
}

// Parsed schedule from Google Sheets
export interface ParsedSchedule {
  positions: string[];      // Row headers (Barista, Cashier, etc.)
  days: string[];           // Column headers (Thứ 2, Thứ 3, etc.)
  cells: ShiftData[][];     // 2D array of shift data
}

// Employee hourly wage configuration
export interface EmployeeWage {
  employeeName: string;
  hourlyWage: number;
}

// Final salary calculation result
export interface SalaryCalculation {
  employeeName: string;
  totalHours: number;
  hourlyWage: number;
  totalSalary: number;      // Base salary only
  totalAllowance: number;   // NEW: Total allowance
  finalSalary: number;      // NEW: totalSalary + totalAllowance
  daysWorked: number;
  shifts: Array<{
    date: string;
    hours: number;
    shiftType: string;
    allowance: number;      // NEW: Allowance per shift
  }>;
  // NEW: Shift breakdown by type
  shiftBreakdown: {
    'M-14h': number;
    'M': number;
    'N': number;
    'ca3': number;
    'custom': number;
  };
}

// API response types
export interface SheetImportResult {
  success: boolean;
  data?: ParsedSchedule;
  error?: string;
}

// Storage keys
export const STORAGE_KEYS = {
  WAGES: 'salary-calculator-wages',
  SHEET_DATA: 'salary-calculator-sheet-data',  // NEW: Lưu CSV data
  LAST_FETCH: 'salary-calculator-last-fetch', // NEW: Thời gian fetch lần cuối
} as const;

// Monthly calculation types
export interface MonthlySalaryCalculation {
  month: string;           // Format: "YYYY-MM" e.g., "2026-06"
  monthLabel: string;      // Display: "Tháng 6/2026"
  employees: SalaryCalculation[];
  totalHours: number;
  totalSalary: number;     // Base salary only
  totalAllowance: number;  // NEW: Total allowance for month
  finalSalary: number;     // NEW: Total salary + allowance
  dateRange: {
    start: string;         // "2026-06-01"
    end: string;           // "2026-06-30"
  };
}

// Multi-sheet import result
export interface MultiSheetImportResult {
  success: boolean;
  data?: {
    sheets: ParsedSchedule[];
    combinedSchedule: ParsedSchedule;
  };
  sheetNames?: string[];
  error?: string;
}
```

---

## 2.2 Shift Hour Constants (`lib/constants.ts`)

### Implementation

```typescript
/**
 * Shift duration in hours for each shift type
 */
export const SHIFT_HOURS = {
  'M-14h': 7.5,   // 6:30-14:00
  'M': 8.5,       // 6:30-15:00
  'N': 8,         // 14:00-22:00
  'ca3': 4,       // 18:00-22:00 (column-based only)
  'custom': 0,    // Calculated from customHours
} as const;

/**
 * Regex patterns for parsing cell values
 */
export const SHIFT_PATTERNS = {
  // "Nhật M - 14h" → employee: "Nhật", shift: "M", end: "14"
  withTime: /^(.+?) ([MN]) - (\d+)h$/,

  // "Thu Na N" → employee: "Thu Na", shift: "N"
  shiftOnly: /^(.+?) ([MN])$/,

  // "Lan 10h-18h" → employee: "Lan", custom hours
  customRange: /^(.+?) (\d{1,2})h?-(\d{1,2})h?$/,
} as const;

/**
 * Shift type labels for display
 */
export const SHIFT_LABELS = {
  'M-14h': 'Ca Sáng (6:30-14:00)',
  'M': 'Ca Sáng (6:30-15:00)',
  'N': 'Ca Chiều (14:00-22:00)',
  'ca3': 'Ca 3 (18:00-22:00)',
  'custom': 'Tùy chỉnh',
} as const;

/**
 * Allowance configuration (NEW)
 */
export const ALLOWANCE_CONFIG = {
  THRESHOLD_HOURS: 7,      // Ca > 7h được trợ cấp
  AMOUNT: 30000,           // 30,000 VND per eligible shift
} as const;
```

---

## 2.3 Sheets Parser (`lib/sheets-parser.ts`)

### Implementation

```typescript
import Papa from 'papaparse';
import { SHIFT_PATTERNS, SHIFT_HOURS } from './constants';
import { ShiftData, ParsedSchedule } from '@/types';

/**
 * Extract sheet ID from Google Sheets URL
 * Supports both full URLs and shortened URLs
 */
export function extractSheetId(url: string): string | null {
  // Full URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...
  const fullMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (fullMatch) return fullMatch[1];

  // Short URL: https://docs.google.com/spreadsheets/d/{SHORT_ID}
  const shortMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Parse a single cell value to extract shift data
 * HYBRID APPROACH: Check content first, then fall back to column position
 *
 * Priority:
 * 1. Content markers (M-14h, M, N, custom) - highest priority
 * 2. Column position (Ca 3 = 18h-22h) - fallback
 *
 * @param cellValue - The cell content (employee name with optional shift marker)
 * @param date - The date string for this column
 * @param columnOffset - Position within day (0=Ca1, 1=Ca2, 2=Ca3)
 */
export function parseCell(cellValue: string, date: string, columnOffset: number): ShiftData {
  const trimmed = cellValue.trim();

  if (!trimmed) {
    return {
      employee: '',
      shiftType: null,
      date,
      columnOffset,
    };
  }

  // PRIORITY 1: Check content markers first

  // Pattern 1: "Nhật M - 14h" (shift with end time)
  const withTimeMatch = trimmed.match(SHIFT_PATTERNS.withTime);
  if (withTimeMatch) {
    return {
      employee: withTimeMatch[1].trim(),
      shiftType: (withTimeMatch[2] + '-' + withTimeMatch[3] + 'h') as 'M-14h',
      date,
      columnOffset,
    };
  }

  // Pattern 2: "Thu Na N" or "Nhật M" (shift marker)
  const shiftOnlyMatch = trimmed.match(SHIFT_PATTERNS.shiftOnly);
  if (shiftOnlyMatch) {
    return {
      employee: shiftOnlyMatch[1].trim(),
      shiftType: shiftOnlyMatch[2] as 'M' | 'N',
      date,
      columnOffset,
    };
  }

  // Pattern 3: "Lan 10h-18h" (custom hours)
  const customMatch = trimmed.match(SHIFT_PATTERNS.customRange);
  if (customMatch) {
    return {
      employee: customMatch[1].trim(),
      shiftType: 'custom',
      customHours: {
        start: parseInt(customMatch[2], 10),
        end: parseInt(customMatch[3], 10),
      },
      date,
      columnOffset,
    };
  }

  // PRIORITY 2: Fall back to column position for Ca 3 only
  // columnOffset % 3 === 2 means this is the 3rd column (Ca 3)
  const shiftColumn = columnOffset % 3;
  if (shiftColumn === 2) {
    // Ca 3: 18:00-22:00 (4h)
    return {
      employee: trimmed,
      shiftType: 'ca3',
      date,
      columnOffset,
    };
  }

  // Default: just employee name, no shift info
  return {
    employee: trimmed,
    shiftType: null,
    date,
    columnOffset,
  };
}

/**
 * Parse CSV text from Google Sheets export
 */
export function parseCSV(csvText: string): ParsedSchedule {
  const result = Papa.parse(csvText, {
    skipEmptyLines: true,
    trimHeaders: false,
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  const rows = result.data as string[][];
  if (rows.length === 0) {
    return { positions: [], days: [], cells: [][] };
  }

  // First row contains day headers (skip first column which is "VỊ TRÍ")
  const days = rows[0].slice(1).map((d) => d.trim());

  // First column of subsequent rows contains positions
  const positions: string[] = [];
  const cells: ShiftData[][] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0) continue;

    positions.push(row[0].trim());

    // Parse each cell in the row
    // IMPORTANT: columnOffset tracks position for shift determination
    const rowCells: ShiftData[] = [];
    for (let j = 1; j < row.length && j <= days.length; j++) {
      const date = days[j - 1];
      const columnOffset = j - 1; // 0-based for determining ca1/ca2/ca3
      rowCells.push(parseCell(row[j] || '', date, columnOffset));
    }
    cells.push(rowCells);
  }

  return { positions, days, cells };
}

/**
 * Extract all unique employee names from schedule
 */
export function extractEmployees(schedule: ParsedSchedule): string[] {
  const employeeSet = new Set<string>();

  for (const row of schedule.cells) {
    for (const cell of row) {
      if (cell.employee) {
        employeeSet.add(cell.employee);
      }
    }
  }

  return Array.from(employeeSet).sort();
}
```

---

## 2.4 Salary Calculator (`lib/salary-calculator.ts`)

### Implementation

```typescript
import { SHIFT_HOURS } from './constants';
import { ParsedSchedule, SalaryCalculation, EmployeeWage, ShiftData } from '@/types';

/**
 * Calculate hours worked for a single shift
 * Returns: { hours, allowance }
 */
export function calculateShiftHours(shift: ShiftData): { hours: number; allowance: number } {
  if (shift.shiftType === null || !shift.employee) {
    return { hours: 0, allowance: 0 };
  }

  let hours: number;

  if (shift.shiftType === 'custom' && shift.customHours) {
    const { start, end } = shift.customHours;
    hours = end - start;
  } else {
    hours = SHIFT_HOURS[shift.shiftType as keyof typeof SHIFT_HOURS] || 0;
  }

  // Calculate allowance: if hours > threshold, get allowance
  const allowance = hours > ALLOWANCE_CONFIG.THRESHOLD_HOURS ? ALLOWANCE_CONFIG.AMOUNT : 0;

  return { hours, allowance };
}

/**
 * Aggregate total hours and shifts by employee
 * UPDATED: Include allowance and shift breakdown
 */
export function aggregateEmployeeData(
  schedule: ParsedSchedule
): Map<string, {
  totalHours: number;
  totalAllowance: number;  // NEW
  daysWorked: number;
  shifts: SalaryCalculation['shifts'];
  shiftBreakdown: SalaryCalculation['shiftBreakdown'];  // NEW
}> {
  const employeeData = new Map();

  for (let rowIdx = 0; rowIdx < schedule.cells.length; rowIdx++) {
    for (let colIdx = 0; colIdx < schedule.cells[rowIdx].length; colIdx++) {
      const cell = schedule.cells[rowIdx][colIdx];
      if (!cell.employee) continue;

      const { hours, allowance } = calculateShiftHours(cell);
      if (hours === 0) continue;

      const current = employeeData.get(cell.employee) || {
        totalHours: 0,
        totalAllowance: 0,
        daysWorked: 0,
        shifts: [],
        shiftBreakdown: {
          'M-14h': 0,
          'M': 0,
          'N': 0,
          'ca3': 0,
          'custom': 0,
        },
      };

      current.totalHours += hours;
      current.totalAllowance += allowance;
      current.daysWorked += 1;

      // Track shift breakdown
      if (cell.shiftType && current.shiftBreakdown[cell.shiftType] !== undefined) {
        current.shiftBreakdown[cell.shiftType]++;
      } else if (cell.shiftType === 'custom') {
        current.shiftBreakdown['custom']++;
      }

      current.shifts.push({
        date: schedule.days[colIdx],
        hours,
        shiftType: cell.shiftType || 'unknown',
        allowance,
      });

      employeeData.set(cell.employee, current);
    }
  }

  return employeeData;
}

/**
 * Calculate salaries for all employees
 * UPDATED: Include allowance and shift breakdown
 */
export function calculateSalaries(
  schedule: ParsedSchedule,
  wages: EmployeeWage[]
): SalaryCalculation[] {
  const employeeData = aggregateEmployeeData(schedule);
  const wageMap = new Map(wages.map((w) => [w.employeeName, w.hourlyWage]));

  const calculations: SalaryCalculation[] = [];

  for (const [employeeName, data] of employeeData.entries()) {
    const hourlyWage = wageMap.get(employeeName) || 0;
    const totalSalary = data.totalHours * hourlyWage;  // Base salary
    const totalAllowance = data.totalAllowance;        // Total allowance
    const finalSalary = totalSalary + totalAllowance;   // Total to pay

    calculations.push({
      employeeName,
      totalHours: data.totalHours,
      hourlyWage,
      totalSalary,
      totalAllowance,
      finalSalary,
      daysWorked: data.daysWorked,
      shifts: data.shifts,
      shiftBreakdown: data.shiftBreakdown,
    });
  }

  // Sort by final salary descending
  return calculations.sort((a, b) => b.finalSalary - a.finalSalary);
}
```

---

## 2.5 Storage Utilities (`lib/storage.ts`)

### Implementation

```typescript
import { EmployeeWage, STORAGE_KEYS } from '@/types';

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

/**
 * Get saved sheet URL
 */
export function getSheetUrl(): string | null {
  return getStorageItem<string | null>(STORAGE_KEYS.SHEET_URL, null);
}

/**
 * Save sheet URL (REMOVED - URL from .env)
 */

// ==================== SCHEDULE DATA CACHE (NEW) ====================

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

// ==================== MONTHLY CALCULATION (NEW) ====================

/**
 * Parse date string to extract month key (YYYY-MM)
 * Handles formats: "1/6", "2/6", "1/6/2026"
 */
export function parseMonthFromDay(dayString: string): string {
  // Format: "D/M" or "D/M/YYYY"
  const parts = dayString.trim().split('/');
  const day = parts[0];
  const month = parts[1];
  const year = parts[2] || new Date().getFullYear().toString();

  return `${year}-${month.padStart(2, '0')}`;
}

/**
 * Format month key for display
 * "2026-06" → "Tháng 6/2026"
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

/**
 * Group salary calculations by month
 */
export function groupByMonth(
  schedule: ParsedSchedule,
  wages: EmployeeWage[]
): Map<string, SalaryCalculation[]> {
  const monthGroups = new Map<string, SalaryCalculation[]>();

  const calculations = calculateSalaries(schedule, wages);

  for (const calc of calculations) {
    // Group by the months this employee worked
    const employeeMonths = new Set<string>();

    for (const shift of calc.shifts) {
      const month = parseMonthFromDay(shift.date);
      employeeMonths.add(month);
    }

    for (const month of employeeMonths) {
      if (!monthGroups.has(month)) {
        monthGroups.set(month, []);
      }
      monthGroups.get(month)!.push(calc);
    }
  }

  return monthGroups;
}

/**
 * Get date range for a month (1st to last day)
 */
export function getMonthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;

  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

  return { start: firstDay, end: lastDayStr };
}

/**
 * Calculate monthly salaries with aggregation
 * IMPORTANT: Calculates from day 1 to last day of each month
 */
export function calculateMonthlySalaries(
  schedule: ParsedSchedule,
  wages: EmployeeWage[]
): MonthlySalaryCalculation[] {
  const monthlyData = new Map<string, {
    employeeHours: Map<string, number>;
    employeeShifts: Map<string, typeof SalaryCalculation.prototype.shifts>;
  }>();

  // Aggregate hours by employee and month
  for (const row of schedule.cells) {
    for (const cell of row) {
      if (!cell.employee) continue;

      const month = parseMonthFromDay(cell.date);
      const hours = calculateShiftHours(cell);
      if (hours === 0) continue;

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          employeeHours: new Map(),
          employeeShifts: new Map(),
        });
      }

      const monthData = monthlyData.get(month)!;

      // Add hours
      const currentHours = monthData.employeeHours.get(cell.employee) || 0;
      monthData.employeeHours.set(cell.employee, currentHours + hours);

      // Add shift detail
      if (!monthData.employeeShifts.has(cell.employee)) {
        monthData.employeeShifts.set(cell.employee, []);
      }
      monthData.employeeShifts.get(cell.employee)!.push({
        date: cell.date,
        hours,
        shiftType: cell.shiftType || 'unknown',
      });
    }
  }

  // Build monthly calculations
  const wageMap = new Map(wages.map((w) => [w.employeeName, w.hourlyWage]));
  const results: MonthlySalaryCalculation[] = [];

  for (const [month, data] of monthlyData.entries()) {
    const employees: SalaryCalculation[] = [];

    for (const [employeeName, hours] of data.employeeHours.entries()) {
      const hourlyWage = wageMap.get(employeeName) || 0;
      const shifts = data.employeeShifts.get(employeeName) || [];

      employees.push({
        employeeName,
        totalHours: hours,
        hourlyWage,
        totalSalary: hours * hourlyWage,
        daysWorked: shifts.length,
        shifts,
      });
    }

    // Sort by total salary descending
    employees.sort((a, b) => b.totalSalary - a.totalSalary);

    const monthRange = getMonthRange(month);

    results.push({
      month,
      monthLabel: formatMonthLabel(month),
      employees,
      totalHours: employees.reduce((sum, e) => sum + e.totalHours, 0),
      totalSalary: employees.reduce((sum, e) => sum + e.totalSalary, 0),
      totalAllowance: employees.reduce((sum, e) => sum + e.totalAllowance, 0),  // NEW
      finalSalary: employees.reduce((sum, e) => sum + e.finalSalary, 0),      // NEW
      dateRange: monthRange,
    });
  }

  // Sort by month
  results.sort((a, b) => a.month.localeCompare(b.month));

  return results;
}
```

---

## Verification Checklist

- [ ] `parseCell()` correctly parses all shift patterns
- [ ] `parseCSV()` handles empty rows and cells
- [ ] `calculateShiftHours()` returns correct hours for each shift type
- [ ] `calculateSalaries()` aggregates by employee correctly
- [ ] `localStorage` operations work in browser
- [ ] TypeScript types compile without errors

---

## Dependencies

**Depends on:** Phase 1 (Project Setup)

**Required for:** Phase 3 (API Endpoint), Phase 4 (UI Components)

---

## Estimated Time

**Total: 4 hours**
- Type definitions: 30 min
- Constants: 15 min
- Sheets parser: 1.5h
- Salary calculator: 1h
- Storage utilities: 45 min
