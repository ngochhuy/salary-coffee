// Represents shift data for a single employee on a single day
export interface ShiftData {
  employee: string;
  shiftType: 'M-14h' | 'M' | 'N' | 'ca1' | 'ca2' | 'ca3' | 'custom' | null;
  customHours?: { start: number; end: number };
  date: string;
  // Column index within the day (0=Ca1, 1=Ca2, 2=Ca3)
  columnOffset: number;
  // Allowance for this shift
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

// Final salary calculation result for a single employee
export interface SalaryCalculation {
  employeeName: string;
  totalHours: number;
  hourlyWage: number;
  totalSalary: number;      // Base salary only
  totalAllowance: number;   // Total allowance
  finalSalary: number;      // totalSalary + totalAllowance
  daysWorked: number;
  shifts: Array<{
    date: string;
    hours: number;
    shiftType: string;
    allowance: number;
  }>;
  // Shift breakdown by type
  shiftBreakdown: {
    'M-14h': number;
    'M': number;
    'N': number;
    'ca1': number;
    'ca2': number;
    'ca3': number;
    'custom': number;
    'unknown': number;
  };
}

// Monthly calculation result
export interface MonthlySalaryCalculation {
  month: string;           // Format: "YYYY-MM" e.g., "2026-06"
  monthLabel: string;      // Display: "Tháng 6/2026"
  employees: SalaryCalculation[];
  totalHours: number;
  totalSalary: number;     // Base salary only
  totalAllowance: number;  // Total allowance for month
  finalSalary: number;     // Total salary + allowance
  dateRange: {
    start: string;         // "2026-06-01"
    end: string;           // "2026-06-30"
  };
}

// Storage keys
export const STORAGE_KEYS = {
  WAGES: 'salary-calculator-wages',
  SHEET_DATA: 'salary-calculator-sheet-data',
  LAST_FETCH: 'salary-calculator-last-fetch',
} as const;
