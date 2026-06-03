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
 * Check if a string is a date in format D/M or D/M/YYYY
 * Examples: "1/6", "2/6", "1/6/2026"
 */
function isDateValue(value: string): boolean {
  const trimmed = value.trim();
  // Pattern: digit(s)/digit(s) optionally followed by /year
  return /^\d+\/\d+(\/\d+)?$/.test(trimmed);
}

/**
 * Extract day values from date row
 * Date row format: "1/6", "2/6", "3/6", etc. - one column per day
 * Returns array of dates for each data column (3 columns per day = Ca1, Ca2, Ca3)
 *
 * Example: If dateRow = ["", "1/6", "2/6", "3/6"]
 *          Returns ["1/6", "1/6", "1/6", "2/6", "2/6", "2/6", "3/6", "3/6", "3/6"]
 *          (each date repeated 3 times for Ca1, Ca2, Ca3)
 */
function extractDaysFromDateRow(dateRow: string[]): string[] {
  const days: string[] = [];
  const SHIFTS_PER_DAY = 3;

  // First, collect unique dates from dateRow (skip first column)
  const uniqueDates: string[] = [];
  for (let i = 1; i < dateRow.length; i++) {
    const cellValue = dateRow[i]?.trim();
    if (cellValue && isDateValue(cellValue)) {
      uniqueDates.push(cellValue);
    } else {
      // For non-date cells, try to extract date or create placeholder
      if (cellValue) {
        uniqueDates.push(cellValue);
      }
    }
  }

  // Now create days array with each date repeated 3 times (for Ca1, Ca2, Ca3)
  for (const date of uniqueDates) {
    for (let shift = 0; shift < SHIFTS_PER_DAY; shift++) {
      days.push(date);
    }
  }

  return days;
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

  // Pattern 3: "Lan 10h-18h" or "Thu Na 15h30 - 22h00" (custom hours)
  const customMatch = trimmed.match(SHIFT_PATTERNS.customRange);
  if (customMatch) {
    // Group 1: employee, 2: start hour, 3: start minute (optional), 4: end hour, 5: end minute (optional)
    const startHour = parseInt(customMatch[2], 10);
    const startMinute = customMatch[3] ? parseInt(customMatch[3], 10) : 0;
    const endHour = parseInt(customMatch[4], 10);
    const endMinute = customMatch[5] ? parseInt(customMatch[5], 10) : 0;

    // Convert to decimal hours (e.g., 15h30 = 15.5)
    const startDecimal = startHour + startMinute / 60;
    const endDecimal = endHour + endMinute / 60;

    return {
      employee: customMatch[1].trim(),
      shiftType: 'custom',
      customHours: {
        start: startDecimal,
        end: endDecimal,
      },
      date,
      columnOffset,
    };
  }

  // PRIORITY 2: Fall back to column position for all shift types
  // Each day has 3 columns: Ca 1, Ca 2, Ca 3
  const shiftColumn = columnOffset % 3;

  if (shiftColumn === 0) {
    // Ca 1: 6:30-12:00 (5.5h)
    return {
      employee: trimmed,
      shiftType: 'ca1',
      date,
      columnOffset,
    };
  }

  if (shiftColumn === 1) {
    // Ca 2: 12:00-19:00 (7h)
    return {
      employee: trimmed,
      shiftType: 'ca2',
      date,
      columnOffset,
    };
  }

  if (shiftColumn === 2) {
    // Ca 3: 18:00-22:00 (4h)
    return {
      employee: trimmed,
      shiftType: 'ca3',
      date,
      columnOffset,
    };
  }

  // Default: just employee name, no shift info (shouldn't reach here)
  return {
    employee: trimmed,
    shiftType: null,
    date,
    columnOffset,
  };
}

/**
 * Vietnamese phone number patterns
 * Matches: 0898123456, 0912345678, 03xxxxxxxx, 0909 123 456, 0898 123 456
 */
function isPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/\s/g, ''); // Remove spaces
  // Vietnamese mobile: 0[3-9] + 8 digits, or 0[1-2] + 9 digits
  return /^0[3-9]\d{8}$|^0[1-2]\d{9}$/.test(cleaned);
}

/**
 * Check if a row is a header/non-data row
 * Skip rows that are:
 * - THỨ headers (THỨ 2, THỨ 3, etc.)
 * - Shift headers (Ca 1, Ca 2, ca 3)
 * - Position labels (VỊ TRÍ, CONTACT INFO)
 * - Owner contact info (contains phone numbers)
 * - Empty or too short
 */
function isNonDataRow(row: string[]): boolean {
  if (row.length < 2) return true;

  const firstCol = row[0]?.trim().toLowerCase();

  // Skip known header rows (more strict matching)
  if (firstCol === 'thứ' || firstCol.startsWith('thứ ')) return true;
  if (firstCol === 'vị trí' || firstCol === 'vị trí:') return true;
  if (firstCol.includes('contact') || firstCol.includes('info')) return true;

  // Skip owner contact info rows - check if first column contains phone number
  // "Long 0898...", "An 0912...", etc.
  const firstColOriginal = row[0]?.trim();
  if (firstColOriginal) {
    // Check if the first column value contains a phone number
    const parts = firstColOriginal.split(/\s+/);
    for (const part of parts) {
      if (isPhoneNumber(part)) {
        console.log(`🚫 Skipping owner contact row: "${firstColOriginal}"`);
        return true;
      }
    }
  }

  // Don't skip "Barista" - it might be an employee name!
  // Only skip if it's clearly a label like "VỊ TRÍ: Barista"
  if (firstCol === 'barista' && row.length > 1 && row[1]?.trim().toLowerCase() === 'barista') return true;

  // Skip pure "Ca X" header rows (first column is just "Ca", "Ca 1", etc.)
  if (/^(ca|ca\s+\d+|ca\s+[123])$/.test(firstCol)) return true;

  // Skip rows where all cells (after first) are empty or contain only headers
  const hasData = row.slice(1).some(cell => {
    const trimmed = cell?.trim();
    return trimmed && !isDateValue(trimmed) && !trimmed.toLowerCase().startsWith('ca ');
  });

  return !hasData;
}

/**
 * Parse CSV text from Google Sheets export
 * Handles complex sheet structure with multiple header rows
 *
 * Sheet structure:
 * - Row 0: Red header (skip)
 * - Row 1: THỨ headers (skip)
 * - Row 2: Date headers "1/6", "2/6", etc. (use these)
 * - Row 3: Shift headers "Ca 1", "Ca 2", "ca 3" (skip)
 * - Rows 4+: Employee data
 * - Row N: Position labels like "Barista" (skip)
 * - Row N+: CONTACT INFO (skip)
 */
export function parseCSV(csvText: string): ParsedSchedule {
  const result = Papa.parse(csvText, {
    skipEmptyLines: true as any,
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  const rows = (result.data as any) as string[][];
  if (rows.length === 0) {
    return { positions: [], days: [], cells: [[]] };
  }

  // Step 1: Find the date row (contains values like "1/6", "2/6", etc.)
  let dateRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    // Check if this row has date values (skip first column)
    const hasDates = row.slice(1).some(cell => cell && isDateValue(cell));
    if (hasDates) {
      dateRowIndex = i;
      break;
    }
  }

  if (dateRowIndex === -1) {
    console.warn('Could not find date row, using row 2 as fallback');
    dateRowIndex = 2;
  }

  // Step 2: Extract days from date row
  const dateRow = rows[dateRowIndex];
  const days = extractDaysFromDateRow(dateRow);

  // Debug: Log parsed dates
  console.log('📅 Parsed dates (first 20):', days.slice(0, 20));
  console.log('📅 Total dates:', days.length);

  // Step 3: Parse employee data rows (skip header rows and non-data rows)
  const positions: string[] = [];
  const cells: ShiftData[][] = [];
  const SHIFTS_PER_DAY = 3;

  // Start from row after date row
  for (let i = dateRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0) continue;

    // Skip non-data rows (headers, labels, etc.)
    if (isNonDataRow(row)) continue;

    // Get position name (first column) - might be position label or employee name
    const firstCol = row[0]?.trim();

    // Check if this is an employee data row
    // Employee rows have shift data in subsequent columns
    const hasShiftData = row.slice(1).some(cell => {
      const trimmed = cell?.trim();
      if (!trimmed) return false;
      // Check if it looks like employee + shift info
      return !isDateValue(trimmed) && !trimmed.toLowerCase().startsWith('ca ');
    });

    // Skip rows without shift data (empty rows, etc.)
    // But DON'T stop processing - just continue to next row
    if (!hasShiftData) {
      console.log(`⚠️ Skipping row ${i} (no shift data): "${firstCol}"`);
      continue;
    }

    positions.push(firstCol || `Nhân viên ${positions.length + 1}`);

    // Parse each cell in the row
    // days array has each date repeated 3 times (for Ca1, Ca2, Ca3)
    const rowCells: ShiftData[] = [];
    for (let j = 1; j < row.length && j <= days.length; j++) {
      const date = days[j - 1] || `Ngày ${Math.floor((j - 1) / SHIFTS_PER_DAY) + 1}`;
      const columnOffset = (j - 1) % SHIFTS_PER_DAY; // 0=Ca1, 1=Ca2, 2=Ca3

      rowCells.push(parseCell(row[j] || '', date, columnOffset));
    }
    cells.push(rowCells);
  }

  // Debug: Log Trúc's shifts
  const trucShifts: any[] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      const cell = cells[i][j];
      if (cell.employee && cell.employee.toLowerCase().includes('truc')) {
        trucShifts.push({ date: cell.date, shiftType: cell.shiftType, hours: cell.customHours });
      }
    }
  }
  console.log('👤 Trúc shifts (all):', trucShifts);

  // Extract unique employee names from cells for positions
  // Filter out invalid values: empty, numbers, header labels, single chars, phone numbers
  const employeeSet = new Set<string>();
  const invalidPatterns = [
    /^CONTACT INFO$/i,
    /^VỊ TRÍ/i,
    /^BARISTA$/i,
    /^LONG$/i,  // Owner name - skip
    /^\d+$/,  // Only numbers (phone numbers)
    /^[`~!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]+$/,  // Only special chars
    /^[a-z0-9]$/i,  // Single character
    // Vietnamese phone number patterns (starts with 0 + 1 digit + 8 more digits)
    // All mobile prefixes: 03, 04, 05, 06, 07, 08, 09
    /^0\d{9}$/,
    // Note: Shift details like "M - 14h" or "(thứ việc)" are CLEANED, not skipped
  ];

  // Clean and filter employee names
  for (const row of cells) {
    for (const cell of row) {
      if (cell.employee) {
        let cleanedName = cell.employee.trim();

        // Skip if empty or too short
        if (!cleanedName || cleanedName.length < 2) continue;

        // First check if it's completely invalid (phone, label, etc.)
        const isInvalid = invalidPatterns.some(pattern => pattern.test(cleanedName));
        if (isInvalid) {
          console.log(`🚫 Skipping invalid: "${cleanedName}"`);
          continue;
        }

        // Clean the name by removing shift details and notes
        // Pattern 1: Remove attached shift marker BEFORE time "PhươngM -14h" → "Phương"
        const attachedShiftBeforeTimeMatch = cleanedName.match(/[MN]\s+-\s*\d+h\d*\b/);
        if (attachedShiftBeforeTimeMatch) {
          cleanedName = cleanedName.substring(0, attachedShiftBeforeTimeMatch.index).trim();
        }
        // Pattern 2: Remove shift markers with time "M -14h", "M - 14h", "M -9h30"
        const timeWithShiftMatch = cleanedName.match(/\s+[MN]\s+-\s*\d+h\d*\b/);
        if (timeWithShiftMatch) {
          cleanedName = cleanedName.substring(0, timeWithShiftMatch.index).trim();
        }
        // Pattern 3: Remove just time marker " -14h", "-9h30" (no M/N)
        const timeOnlyMatch = cleanedName.match(/\s+-\s*\d+h\d*\b/);
        if (timeOnlyMatch) {
          cleanedName = cleanedName.substring(0, timeOnlyMatch.index).trim();
        }
        // Pattern 4: Remove attached shift marker at END "PhươngM" → "Phương"
        const attachedShiftMatch = cleanedName.match(/[MN]$/);
        if (attachedShiftMatch && cleanedName.length > 1) {
          cleanedName = cleanedName.substring(0, attachedShiftMatch.index).trim();
        }
        // Pattern 5: Remove any parenthetical notes like "(thứ việc)"
        const parenMatch = cleanedName.match(/\s*\(.*\)?$/);
        if (parenMatch) {
          cleanedName = cleanedName.substring(0, parenMatch.index).trim();
        }
        // Pattern 6: Remove standalone shift markers with space at end " M", " N"
        const shiftMatch = cleanedName.match(/\s+[MN]$/);
        if (shiftMatch) {
          cleanedName = cleanedName.substring(0, shiftMatch.index).trim();
        }

        if (cleanedName !== cell.employee.trim()) {
          console.log(`🧹 Cleaned "${cell.employee}" → "${cleanedName}"`);
        }

        // Skip if cleaned name is too short (less than 2 chars)
        if (cleanedName.length < 2) continue;

        employeeSet.add(cleanedName);
      }
    }
  }

  // Use unique employee names as positions (sorted)
  const uniquePositions = Array.from(employeeSet).sort();

  console.log('📊 Total positions parsed:', uniquePositions.length);
  console.log('📊 Positions (employees):', uniquePositions);

  return { positions: uniquePositions, days, cells };
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
