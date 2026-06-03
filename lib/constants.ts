/**
 * Shift duration in hours for each shift type
 */
export const SHIFT_HOURS = {
  'M-14h': 7.5,   // 6:30-14:00
  'M': 8.5,       // 6:30-15:00
  'N': 8,         // 14:00-22:00
  'ca1': 5.5,     // 6:30-12:00 (column-based)
  'ca2': 7,       // 12:00-19:00 (column-based)
  'ca3': 4,       // 18:00-22:00 (column-based)
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

  // "Lan 10h-18h" or "Nga 15h - 22h" or "Thu Na 15h30 - 22h00" → employee, custom hours
  // Supports: "10h", "10h30", "10h-18h", "10h30 - 18h00"
  customRange: /^(.+?) (\d{1,2})h(\d{2})?\s*-\s*(\d{1,2})h(\d{2})?$/,
} as const;

/**
 * Shift type labels for display
 */
export const SHIFT_LABELS = {
  'M-14h': 'Ca Sáng (6:30-14:00)',
  'M': 'Ca Sáng (6:30-15:00)',
  'N': 'Ca Chiều (14:00-22:00)',
  'ca1': 'Ca 1 (6:30-12:00)',
  'ca2': 'Ca 2 (12:00-19:00)',
  'ca3': 'Ca 3 (18:00-22:00)',
  'custom': 'Tùy chỉnh',
  'unknown': 'Không xác định (4h)',
} as const;

/**
 * Allowance configuration
 * Shifts longer than threshold hours get allowance amount
 */
export const ALLOWANCE_CONFIG = {
  THRESHOLD_HOURS: 7,      // Ca > 7h được trợ cấp
  AMOUNT: 30000,           // 30,000 VND per eligible shift
} as const;
