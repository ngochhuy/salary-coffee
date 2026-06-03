---
title: "Salary Calculator Web App Implementation"
description: "Complete implementation plan for coffee shop salary calculator with Google Sheets integration"
status: pending
priority: P1
effort: 20.5h
branch: main
tags: [nextjs, google-sheets, salary-calculator, shadcn-ui, multi-sheet, allowance, employee-detail]
created: 2026-06-02
updated: 2026-06-02
---

# Salary Calculator Web App - Implementation Plan

## Overview
Single-page web app to import coffee shop schedules from Google Sheets, parse shift data, calculate hours worked, and compute monthly salaries based on hourly wages stored in localStorage.

---

## Phase 1: Project Setup (2h)

### Tasks

#### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest salary-calculator --typescript --tailwind --app
```

**Configuration choices:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Import alias: `@/*`

#### 1.2 Install Dependencies
```bash
cd salary-calculator
npm install papaparse date-fns
npm install -D @types/papaparse
```

**Dependencies:**
- `papaparse`: CSV parsing from Google Sheets export
- `date-fns`: Date utilities for month calculations

#### 1.3 Setup shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button input card table label textarea alert
```

**Components to add:**
- button, input, card, table, label, textarea, alert, dialog

#### 1.4 Create Folder Structure
```
app/
├── api/
│   └── sheets/
│       └── route.ts
├── page.tsx
├── layout.tsx
├── globals.css
components/
├── ui/                    # shadcn components (auto-generated)
├── sheet-import.tsx
├── schedule-table.tsx
├── wage-input.tsx
└── salary-summary.tsx
lib/
├── sheets-parser.ts
├── salary-calculator.ts
├── storage.ts
└── constants.ts
types/
└── index.ts
```

**Files to create:**
- `app/api/sheets/route.ts` - API endpoint for sheet fetching
- `app/page.tsx` - Main dashboard
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Global styles
- `components/sheet-import.tsx` - Sheet URL input form
- `components/schedule-table.tsx` - Display parsed schedule
- `components/wage-input.tsx` - Hourly wage input interface
- `components/salary-summary.tsx` - Salary calculations display
- `lib/sheets-parser.ts` - CSV/JSON parsing logic
- `lib/salary-calculator.ts` - Hours × wage calculation engine
- `lib/storage.ts` - localStorage wrapper
- `lib/constants.ts` - Shift hour mappings
- `types/index.ts` - TypeScript type definitions

---

## Phase 2: Core Logic (5h)

### 2.1 Type Definitions (`types/index.ts`)

```typescript
export interface ShiftData {
  employee: string;
  shiftType: 'M' | 'N' | 'full' | 'custom' | null;
  customHours?: { start: number; end: number };
  date: string;
}

export interface ParsedSchedule {
  positions: string[];
  days: string[];
  cells: ShiftData[][];
}

export interface EmployeeWage {
  employeeName: string;
  hourlyWage: number;
}

export interface SalaryCalculation {
  employeeName: string;
  totalHours: number;
  hourlyWage: number;
  totalSalary: number;
  daysWorked: number;
}

export interface SheetImportResult {
  success: boolean;
  data?: ParsedSchedule;
  error?: string;
}
```

### 2.2 Shift Hour Constants (`lib/constants.ts`)

```typescript
export const SHIFT_HOURS = {
  'M-14h': 7.5,      // 6:30-14:00
  'M': 8.5,          // 6:30-15:00
  'N': 8,             // 14:00-22:00
  'ca3': 4,           // 18:00-22:00 (column-based)
  'custom': 0,        // Calculated from customHours
} as const;

export const SHIFT_PATTERNS = {
  withTime: /^(.+?) ([MN]) - (\d+)h$/,
  shiftOnly: /^(.+?) ([MN])$/,
  customRange: /^(.+?) (\d{1,2})h?-(\d{1,2})h?$/,
} as const;

// NEW: Allowance configuration
export const ALLOWANCE_CONFIG = {
  THRESHOLD_HOURS: 7,    // Ca > 7h được trợ cấp
  AMOUNT: 30000,         // 30,000 VND per eligible shift
} as const;
```

### 2.3 Sheets Parser (`lib/sheets-parser.ts`)

**Implementation approach:**
1. Parse CSV using papaparse
2. Extract positions from first column
3. Extract day headers from first row
4. Parse each cell for shift data using regex patterns
5. Return structured `ParsedSchedule`

**Key functions:**
- `parseCSV(csvText: string): ParsedSchedule`
- `parseCell(cellValue: string): ShiftData`
- `extractSheetId(url: string): string | null`

### 2.4 Salary Calculator (`lib/salary-calculator.ts`)

**Implementation approach:**
1. Aggregate hours by employee across all days
2. Apply shift hour multipliers from constants
3. Calculate allowance: shifts > 7 hours get +30,000 VND
4. Multiply by hourly wage from localStorage
5. Track shift breakdown (counts of M-14h, M, N, ca3, custom)
6. Handle custom hour ranges

**Key functions:**
- `calculateSalaries(schedule: ParsedSchedule, wages: EmployeeWage[]): SalaryCalculation[]`
- `calculateShiftHours(shift: ShiftData): { hours: number; allowance: number }`
- `aggregateEmployeeData(schedule: ParsedSchedule): Map<string, { totalHours, totalAllowance, daysWorked, shifts, shiftBreakdown }>`
- `calculateMonthlySalaries(schedule: ParsedSchedule, wages: EmployeeWage[]): MonthlySalaryCalculation[]`
- `parseMonthFromDay(dayString: string): string` - Extract YYYY-MM from date
- `getMonthRange(monthKey: string): { start, end }` - Day 1 to last day of month

### 2.5 Storage Utilities (`lib/storage.ts`)

**Implementation approach:**
1. Wrapper around localStorage with JSON serialization
2. Default values handling
3. Type-safe get/set methods
4. Cache schedule data with timestamp

**Key functions:**
- `setWages(wages: EmployeeWage[]): void`
- `getWages(): EmployeeWage[]`
- `updateWage(employeeName: string, hourlyWage: number): void`
- `getCachedSchedule(): ParsedSchedule | null` - NEW: Cache schedule data
- `setCachedSchedule(schedule: ParsedSchedule): void` - NEW: Save to cache
- `getLastFetch(): Date | null` - NEW: Get last fetch timestamp
- `updateLastFetch(): void` - NEW: Update timestamp
- `clearCachedData(): void` - NEW: Clear all cached data

---

## Phase 3: API Endpoint (2h)

### 3.1 Sheets API Route (`app/api/sheets/route.ts`)

**Implementation approach:**
1. Extract POST body with sheet URL
2. Parse sheet ID from URL
3. Fetch CSV export from Google Sheets
4. Parse CSV using sheets-parser
5. Return JSON or error

**Key logic:**
```typescript
export async function POST(request: Request) {
  const { url } = await request.json();
  const sheetId = extractSheetId(url);
  
  if (!sheetId) {
    return Response.json({ error: 'Invalid sheet URL' }, { status: 400 });
  }
  
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  const data = parseCSV(csvText);
  
  return Response.json({ success: true, data });
}
```

**Error handling:**
- Invalid URL format
- Private sheet (403 error)
- Network failures
- Malformed CSV data

---

## Phase 4: UI Components (8h)

### 4.1 Schedule Table (`components/schedule-table.tsx`)

**Features:**
- Render parsed schedule as table
- Positions as rows, days as columns
- Color-coded shift types
- Show parsed hours per cell

**Props:**
- `schedule: ParsedSchedule`

**Display format:**
- M shift: Blue badge
- N shift: Purple badge
- Ca 3: Gray badge
- Custom: Orange badge with hours

### 4.2 Wage Input (`components/wage-input.tsx`)

**Features:**
- List of all employees from schedule
- Input field for hourly wage per employee
- Save to localStorage on change
- Default wage suggestion

**State:**
- `wages: Record<string, number>`
- `unsavedChanges: Set<string>`

### 4.3 Month Selector (`components/month-selector.tsx`) - NEW

**Features:**
- Navigate between months with arrow buttons
- Show current selected month badge
- "All months" option to view aggregated data
- Filter: "Tất cả" or specific month

**Props:**
- `monthlyData: MonthlySalaryCalculation[]`
- `selectedMonth: string | 'all'`
- `onMonthChange: (month: string | 'all') => void`

### 4.4 Monthly Salary Summary (`components/monthly-salary-summary.tsx`) - NEW

**Features:**
- Display salary breakdown by month
- Separate columns: Base salary, Allowance, Final salary
- Click on employee row to view details
- Show total calculations including allowance
- Print/Save PDF button

**Props:**
- `monthlyData: MonthlySalaryCalculation[]`
- `selectedMonth: string | 'all'`

**Display columns:**
- Employee name (clickable for details)
- Days worked
- Total hours
- Base salary (hours × wage)
- Allowance (trợ cấp)
- Final salary (base + allowance)

### 4.5 Employee Detail Dialog (`components/employee-detail-dialog.tsx`) - NEW

**Features:**
- Show when clicking on employee in summary
- Summary cards: total hours, base salary, allowance, final salary
- Shift breakdown grid: counts of M-14h, M, N, ca3, custom
- Detailed shift table with allowance per shift

**Props:**
- `employee: SalaryCalculation | null`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `monthLabel?: string`

**Display:**
- 4 summary cards at top
- Shift breakdown counts
- Table with: Date, Shift type, Hours, Allowance, Amount

---

## Phase 5: Main Page Integration (2h)

### 5.1 Page State (`app/page.tsx`)

**State management:**
```typescript
const [schedule, setSchedule] = useState<ParsedSchedule | null>(null);
const [wages, setWages] = useState<EmployeeWage[]>([]);
const [calculations, setCalculations] = useState<SalaryCalculation[]>([]);
```

**Effect flow:**
1. Load wages from localStorage on mount
2. When schedule imported → extract employees → merge with wages
3. Recalculate salaries when schedule or wages change

### 5.2 Layout Structure

```tsx
<main className="container mx-auto p-6 space-y-8">
  <header>
    <h1>Salary Calculator</h1>
    <p>Import schedule from Google Sheets</p>
  </header>

  <SheetImport onImport={handleImport} />

  {schedule && (
    <>
      <ScheduleTable schedule={schedule} />
      <WageInput employees={extractEmployees(schedule)} wages={wages} onChange={handleWageChange} />
      <SalarySummary calculations={calculations} />
    </>
  )}
</main>
```

### 5.3 Root Layout (`app/layout.tsx`)

- Set up Inter font
- Configure metadata
- Add global styles

---

## Phase 6: Polish & Error Handling (1h)

### Tasks

#### 6.1 Error States
- Network timeout handling
- Invalid sheet format
- Empty schedule warning
- Missing wage alerts

#### 6.2 Loading States
- Skeleton for table during import
- Button loading indicators
- Toast notifications

#### 6.3 Styling Refinements
- Responsive table (horizontal scroll on mobile)
- Dark mode support
- Print-friendly layout

#### 6.4 Edge Cases
- Employee name variations (typos)
- Multiple employees in one cell
- Empty cells (days off)
- Sheet structure changes

---

## Dependencies Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Core Logic) → types/index.ts, lib/*.ts
    ↓
Phase 3 (API) → app/api/sheets/route.ts (depends: sheets-parser, types)
    ↓
Phase 4 (UI Components) → components/*.tsx (depends: types, lib)
    ↓
Phase 5 (Integration) → app/page.tsx (depends: all components)
    ↓
Phase 6 (Polish) → Error handling, styling
```

---

## File Creation Summary

| Phase | File Path | Purpose |
|-------|-----------|---------|
| 1 | `app/layout.tsx` | Root layout |
| 1 | `app/page.tsx` | Main dashboard |
| 1 | `app/globals.css` | Global styles |
| 1 | `app/api/sheets/route.ts` | Sheets API endpoint |
| 1 | `types/index.ts` | Type definitions |
| 2 | `lib/constants.ts` | Shift mappings + allowance config |
| 2 | `lib/sheets-parser.ts` | CSV parsing (hybrid logic) |
| 2 | `lib/salary-calculator.ts` | Calculation engine + allowance + monthly |
| 2 | `lib/storage.ts` | localStorage wrapper + cache |
| 4 | `components/schedule-table.tsx` | Schedule display |
| 4 | `components/wage-input.tsx` | Wage inputs |
| 4 | `components/month-selector.tsx` | Month filter (NEW) |
| 4 | `components/monthly-salary-summary.tsx` | Monthly results + allowance (NEW) |
| 4 | `components/employee-detail-dialog.tsx` | Employee detail popup (NEW) |
| 5 | `.env.local` | Sheet URL configuration (NEW) |

---

## Testing Checklist

### Core Functionality
- [ ] Import public Google Sheet successfully
- [ ] **Fetch from ALL sheets/tabs in workbook** (NEW)
- [ ] Parse all shift patterns (M-14h, M, N, custom, ca3)
- [ ] **Hybrid parsing: content priority, column fallback** (NEW)
- [ ] Correct hours calculation per shift type
- [ ] Wage persistence across page reloads
- [ ] Salary calculation accuracy

### Monthly & Allowance Features (NEW)
- [ ] **Group shifts by month correctly** (day 1 to last day)
- [ ] **Month selector navigation works**
- [ ] **Month filter applies to summary correctly**
- [ ] **"All months" view shows aggregated data**
- [ ] **Allowance calculated: shifts > 7h get +30,000 VND**
- [ ] **Allowance displayed separately from base salary**
- [ ] **Final salary = base + allowance calculated correctly**

### Employee Detail (NEW)
- [ ] **Click on employee row opens detail dialog**
- [ ] **Detail dialog shows shift breakdown (M-14h, M, N, ca3 counts)**
- [ ] **Detail dialog shows detailed shift list with allowance per shift**
- [ ] **Detail dialog shows correct totals (hours, base, allowance, final)**

### Error Handling & UI
- [ ] Error handling for private sheets
- [ ] Error handling for invalid URLs
- [ ] Empty schedule handling
- [ ] Mobile responsiveness
- [ ] Print/Save PDF button works
- [ ] **Refresh button updates cached data** (NEW)

---

## Validation Summary

**Validated:** 2026-06-02
**Questions asked:** 5

### ✅ Confirmed Decisions

| Decision | User Choice | Status |
|----------|-------------|--------|
| Sheet access | Public sheet | ✅ OK - CSV export works |
| User count | Single user | ✅ OK - localStorage sufficient |
| Data structure | **Multiple tabs (one per week/period)** | ✅ **IMPLEMENTED** |
| Calculation scope | **By month, show all months** | ✅ **IMPLEMENTED** |
| Display mode | **Filterable: all months or specific month** | ✅ **IMPLEMENTED** |
| Shift parsing | **Content priority, column fallback** | ✅ **IMPLEMENTED** |
| Ca 3 special case | **Column 2 (Ca 3) = 18h-22h** | ✅ **IMPLEMENTED** |
| Month calculation | **Day 1 to last day of month** | ✅ **IMPLEMENTED** |
| Data source | **URL from .env file** | ✅ **IMPLEMENTED** |
| Cache strategy | **localStorage with manual refresh** | ✅ **IMPLEMENTED** |
| Allowance | **Ca > 7h: +30,000 VND** | ✅ **IMPLEMENTED** |
| Employee detail | **Click to view shift breakdown** | ✅ **IMPLEMENTED** |

### 📝 Implemented Features

**Priority 1 - Completed:**
1. ✅ **Multi-sheet fetch** - API fetches from all tabs in workbook
2. ✅ **Month grouping** - Groups shifts by month (YYYY-MM)
3. ✅ **Month filter UI** - MonthSelector with "All" option
4. ✅ **Full month range** - Calculates from day 1 to last day
5. ✅ **Hybrid shift parsing** - Content markers first, column fallback
6. ✅ **Allowance calculation** - Shifts > 7h get +30,000 VND
7. ✅ **Employee detail dialog** - Shows shift breakdown, allowance per shift
8. ✅ **Base + Allowance display** - Separated in salary summary

**Updated data flow:**
```
User inputs sheet URL
    ↓
API fetches CSV from ALL tabs in workbook
    ↓
Parser combines data from all sheets
    ↓
Calculator groups shifts by month (1st to last day)
    ↓
User can filter by month or view all
```

**New feature requirements:**
- Month selector component
- Aggregate calculations across multiple sheets
- Date parsing to extract month from day headers

### Remaining Unresolved Questions

1. **Sheet structure variability**: What if positions are in rows vs columns? → MVP assumes standard format, add detection later
2. **Employee name matching**: Handle typos/nicknames? → MVP exact match, add fuzzy match later
3. **Currency formatting**: VND vs other currencies? → MVP VND only, make configurable later

---

## Original Unresolved Questions (Archived)

*The following were resolved during validation:*

- ~~Multiple sheets in workbook~~ → **Answered**: Fetch all tabs, group by month
- ~~Sheet access method~~ → **Answered**: Public sheet, CSV export OK
