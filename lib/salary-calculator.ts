import { SHIFT_HOURS, ALLOWANCE_CONFIG } from './constants';
import { ParsedSchedule, SalaryCalculation, EmployeeWage, MonthlySalaryCalculation, ShiftData } from '@/types';

/**
 * Calculate hours worked for a single shift
 * Returns: { hours, allowance }
 */
export function calculateShiftHours(shift: ShiftData): { hours: number; allowance: number; computedShiftType: string } {
  if (!shift.employee) {
    return { hours: 0, allowance: 0, computedShiftType: 'unknown' };
  }

  let hours: number;
  let computedShiftType: string;

  if (shift.shiftType === 'custom' && shift.customHours) {
    const { start, end } = shift.customHours;
    hours = end - start;
    computedShiftType = 'custom';
  } else if (shift.shiftType && shift.shiftType in SHIFT_HOURS) {
    hours = SHIFT_HOURS[shift.shiftType as keyof typeof SHIFT_HOURS];
    computedShiftType = shift.shiftType;
  } else {
    // No shift marker - assume 4 hours (standard shift)
    hours = 4;
    computedShiftType = 'unknown';
  }

  // Calculate allowance: if hours > threshold, get allowance
  const allowance = hours > ALLOWANCE_CONFIG.THRESHOLD_HOURS ? ALLOWANCE_CONFIG.AMOUNT : 0;

  return { hours, allowance, computedShiftType };
}

/**
 * Aggregate total hours and shifts by employee
 * Includes allowance and shift breakdown
 */
export function aggregateEmployeeData(
  schedule: ParsedSchedule
): Map<string, {
  totalHours: number;
  totalAllowance: number;
  daysWorked: number;
  shifts: SalaryCalculation['shifts'];
  shiftBreakdown: SalaryCalculation['shiftBreakdown'];
}> {
  const employeeData = new Map();

  for (let rowIdx = 0; rowIdx < schedule.cells.length; rowIdx++) {
    for (let colIdx = 0; colIdx < schedule.cells[rowIdx].length; colIdx++) {
      const cell = schedule.cells[rowIdx][colIdx];
      if (!cell.employee) continue;

      const { hours, allowance, computedShiftType } = calculateShiftHours(cell);
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
          'ca1': 0,
          'ca2': 0,
          'ca3': 0,
          'custom': 0,
          'unknown': 0,
        },
      };

      current.totalHours += hours;
      current.totalAllowance += allowance;
      current.daysWorked += 1;

      // Track shift breakdown
      const shiftKey = computedShiftType as keyof typeof current.shiftBreakdown;
      if (current.shiftBreakdown[shiftKey] !== undefined) {
        current.shiftBreakdown[shiftKey]++;
      }

      current.shifts.push({
        date: schedule.days[colIdx],
        hours,
        shiftType: computedShiftType,
        allowance,
      });

      employeeData.set(cell.employee, current);
    }
  }

  return employeeData;
}

/**
 * Calculate salaries for all employees
 * Includes allowance and shift breakdown
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

// ==================== MONTHLY CALCULATION ====================

/**
 * Parse date string to extract month key (YYYY-MM)
 * Handles formats: "1/6", "2/6", "1/6/2026"
 * Returns "unknown" if format doesn't match
 */
export function parseMonthFromDay(dayString: string): string {
  // Format: "D/M" or "D/M/YYYY"
  const trimmed = dayString.trim();
  const parts = trimmed.split('/');

  // Need at least day and month
  if (parts.length < 2) {
    console.warn(`Invalid date format: "${dayString}"`);
    return 'unknown';
  }

  const day = parts[0];
  const month = parts[1];

  // Validate month exists and is a number
  if (!month || isNaN(parseInt(month))) {
    console.warn(`Invalid month in date: "${dayString}"`);
    return 'unknown';
  }

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
    employeeData: Map<string, {
      totalHours: number;
      totalAllowance: number;
      daysWorked: number;
      shifts: SalaryCalculation['shifts'];
      shiftBreakdown: SalaryCalculation['shiftBreakdown'];
    }>;
  }>();

  // Aggregate hours by employee and month
  for (let rowIdx = 0; rowIdx < schedule.cells.length; rowIdx++) {
    for (let colIdx = 0; colIdx < schedule.cells[rowIdx].length; colIdx++) {
      const cell = schedule.cells[rowIdx][colIdx];
      if (!cell.employee) continue;

      const month = parseMonthFromDay(cell.date);
      // Skip if date format is invalid
      if (month === 'unknown') continue;

      const { hours, allowance, computedShiftType } = calculateShiftHours(cell);
      if (hours === 0) continue;

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          employeeData: new Map(),
        });
      }

      const monthInfo = monthlyData.get(month)!;
      const current = monthInfo.employeeData.get(cell.employee) || {
        totalHours: 0,
        totalAllowance: 0,
        daysWorked: 0,
        shifts: [],
        shiftBreakdown: {
          'M-14h': 0,
          'M': 0,
          'N': 0,
          'ca1': 0,
          'ca2': 0,
          'ca3': 0,
          'custom': 0,
          'unknown': 0,
        },
      };

      current.totalHours += hours;
      current.totalAllowance += allowance;
      current.daysWorked += 1;

      // Track shift breakdown
      const shiftKey = computedShiftType as keyof typeof current.shiftBreakdown;
      if (current.shiftBreakdown[shiftKey] !== undefined) {
        current.shiftBreakdown[shiftKey]++;
      }

      current.shifts.push({
        date: cell.date,
        hours,
        shiftType: computedShiftType,
        allowance,
      });

      monthInfo.employeeData.set(cell.employee, current);
    }
  }

  // Build monthly calculations
  const wageMap = new Map(wages.map((w) => [w.employeeName, w.hourlyWage]));
  const results: MonthlySalaryCalculation[] = [];

  for (const [month, monthInfo] of monthlyData.entries()) {
    const employees: SalaryCalculation[] = [];

    for (const [employeeName, data] of monthInfo.employeeData.entries()) {
      const hourlyWage = wageMap.get(employeeName) || 0;
      const totalSalary = data.totalHours * hourlyWage;
      const totalAllowance = data.totalAllowance;
      const finalSalary = totalSalary + totalAllowance;

      employees.push({
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
    employees.sort((a, b) => b.finalSalary - a.finalSalary);

    const monthRange = getMonthRange(month);

    results.push({
      month,
      monthLabel: formatMonthLabel(month),
      employees,
      totalHours: employees.reduce((sum, e) => sum + e.totalHours, 0),
      totalSalary: employees.reduce((sum, e) => sum + e.totalSalary, 0),
      totalAllowance: employees.reduce((sum, e) => sum + e.totalAllowance, 0),
      finalSalary: employees.reduce((sum, e) => sum + e.finalSalary, 0),
      dateRange: monthRange,
    });
  }

  // Sort by month
  results.sort((a, b) => a.month.localeCompare(b.month));

  return results;
}

/**
 * Extract all unique employee names from schedule
 */
export function extractEmployees(schedule: ParsedSchedule | null): string[] {
  if (!schedule) return [];

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
