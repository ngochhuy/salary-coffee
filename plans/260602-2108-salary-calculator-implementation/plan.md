---
title: "Salary Calculator Web App Implementation"
description: "Complete implementation plan for coffee shop salary calculator with Google Sheets integration"
status: pending
priority: P1
effort: 16h
branch: main
tags: [nextjs, google-sheets, salary-calculator, shadcn-ui]
created: 2026-06-02
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

## Phase 2: Core Logic (4h)

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
  'full': 16,         // 6:00-22:00
} as const;

export const SHIFT_PATTERNS = {
  withTime: /^(.+?) ([MN]) - (\d+)h$/,
  shiftOnly: /^(.+?) ([MN])$/,
  nameOnly: /^(.+)$/,
  customRange: /^(.+?) (\d{1,2})h?-(\d{1,2})h?$/,
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
3. Multiply by hourly wage from localStorage
4. Handle custom hour ranges

**Key functions:**
- `calculateSalaries(schedule: ParsedSchedule, wages: EmployeeWage[]): SalaryCalculation[]`
- `calculateShiftHours(shift: ShiftData): number`
- `aggregateEmployeeHours(schedule: ParsedSchedule): Map<string, number>`

### 2.5 Storage Utilities (`lib/storage.ts`)

**Implementation approach:**
1. Wrapper around localStorage with JSON serialization
2. Default values handling
3. Type-safe get/set methods

**Key functions:**
- `setWages(wages: EmployeeWage[]): void`
- `getWages(): EmployeeWage[]`
- `setSheetUrl(url: string): void`
- `getSheetUrl(): string | null`

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

## Phase 4: UI Components (5h)

### 4.1 Sheet Import (`components/sheet-import.tsx`)

**Features:**
- Input field for Google Sheets URL
- "Import Schedule" button
- Loading state during fetch
- Error display
- Success notification

**State:**
- `url: string`
- `loading: boolean`
- `error: string | null`

### 4.2 Schedule Table (`components/schedule-table.tsx`)

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
- Full day: Green badge
- Custom: Orange badge with hours

### 4.3 Wage Input (`components/wage-input.tsx`)

**Features:**
- List of all employees from schedule
- Input field for hourly wage per employee
- Save to localStorage on change
- Default wage suggestion

**State:**
- `wages: Record<string, number>`
- `unsavedChanges: Set<string>`

### 4.4 Salary Summary (`components/salary-summary.tsx`)

**Features:**
- Table with employee, hours, wage, salary
- Total hours/salary aggregate
- Export to CSV button
- Month selector (future)

**Props:**
- `calculations: SalaryCalculation[]`

**Display columns:**
- Employee name
- Days worked
- Total hours
- Hourly wage
- Total salary (VND formatted)

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
| 2 | `lib/constants.ts` | Shift mappings |
| 2 | `lib/sheets-parser.ts` | CSV parsing |
| 2 | `lib/salary-calculator.ts` | Calculation engine |
| 2 | `lib/storage.ts` | localStorage wrapper |
| 4 | `components/sheet-import.tsx` | URL input form |
| 4 | `components/schedule-table.tsx` | Schedule display |
| 4 | `components/wage-input.tsx` | Wage inputs |
| 4 | `components/salary-summary.tsx` | Results display |

---

## Testing Checklist

- [ ] Import public Google Sheet successfully
- [ ] Parse all shift patterns (M-14h, M, N, custom)
- [ ] Correct hours calculation per shift type
- [ ] Wage persistence across page reloads
- [ ] Salary calculation accuracy
- [ ] Error handling for private sheets
- [ ] Error handling for invalid URLs
- [ ] Empty schedule handling
- [ ] Mobile responsiveness

---

## Unresolved Questions

1. **Sheet structure variability**: What if positions are in rows vs columns? → MVP assumes standard format, add detection later
2. **Multiple sheets in workbook**: Which sheet to read? → Default to first, add selector later
3. **Employee name matching**: Handle typos/nicknames? → MVP exact match, add fuzzy match later
4. **Currency formatting**: VND vs other currencies? → MVP VND only, make configurable later
