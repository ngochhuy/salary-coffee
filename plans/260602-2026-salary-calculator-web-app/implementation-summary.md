# Salary Calculator Implementation Summary (UPDATED)

## Quick Reference

**Project**: Salary Calculator for Coffee Shop
**Tech Stack**: Next.js 15 + TypeScript + shadcn/ui + Tailwind CSS
**Total Estimated Time**: 20.5 hours
**Current Status**: Ready to Implement
**Last Updated**: 2026-06-02 (Multi-sheet, Monthly, Allowance, Employee Detail)

---

## Validation Results ✅

| Decision | User Choice | Status |
|----------|-------------|--------|
| Sheet access | Public sheet | ✅ OK |
| User count | Single user | ✅ OK |
| Data structure | **Multiple tabs/sheets** | ✅ Implemented |
| Calculation scope | **By month, show all** | ✅ Implemented |
| Display mode | **Filterable: all or specific month** | ✅ Implemented |

---

## Key Changes From Validation

### 1. Multi-Sheet Support
- API now fetches from **ALL tabs** in workbook, not just first sheet
- Combines data from multiple sheets into single schedule

### 2. Monthly Calculation
- New `calculateMonthlySalaries()` function
- Groups shifts by month (parseMonthFromDay)
- Returns `MonthlySalaryCalculation[]` instead of flat list

### 3. Month Filter UI
- New `MonthSelector` component with navigation
- New `MonthlySalarySummary` component for grouped display
- Filter: "All months" or specific month

---

## File Structure Overview

```
salary-calculator/
├── app/
│   ├── api/sheets/
│   │   └── route.ts              # Phase 3: API endpoint (multi-sheet fetch)
│   ├── layout.tsx                # Phase 5: Root layout
│   ├── page.tsx                  # Phase 5: Main dashboard
│   └── globals.css              # Phase 5: Global styles
├── components/
│   ├── ui/                       # shadcn/ui components (Phase 1)
│   ├── sheet-import.tsx         # Phase 4: URL input form
│   ├── schedule-table.tsx       # Phase 4: Schedule display
│   ├── wage-input.tsx           # Phase 4: Wage inputs
│   ├── month-selector.tsx       # Phase 4: Month filter (NEW)
│   └── monthly-salary-summary.tsx # Phase 4: Results by month (NEW)
├── lib/
│   ├── constants.ts              # Phase 2: Shift mappings
│   ├── sheets-parser.ts         # Phase 2: CSV parsing
│   ├── salary-calculator.ts     # Phase 2: Calculation engine + monthly logic
│   ├── storage.ts               # Phase 2: localStorage wrapper
│   └── api.ts                   # Phase 3: API helper
└── types/
    └── index.ts                  # Phase 2: Type definitions + Monthly types
```

---

## Phase-by-Phase Overview

| Phase | Title | Time | Key Outputs |
|-------|-------|------|-------------|
| 1 | Project Setup | 2h | Next.js project, shadcn/ui, folder structure |
| 2 | Core Logic | 5h | Parser, calculator, storage, types, **monthly logic, allowance** |
| 3 | API Endpoint | 2.5h | `/api/sheets` route, **multi-sheet fetch** |
| 4 | UI Components | 8h | 7 React components (**+ MonthSelector, MonthlySalarySummary, EmployeeDetailDialog**) |
| 5 | Integration | 2h | Main page with **monthly state management** |
| 6 | Polish | 1h | Error handling, responsive, accessibility |

---

## Key Implementation Details

### Shift Parsing Logic (HYBRID)

**Priority: Content markers FIRST, then column fallback**

```
┌─────────────────────────────────────────────────────┐
│ PRIORITY 1: Content markers (highest)              │
├─────────────────────────────────────────────────────┤
│ "Nhật M - 14h"  → 7.5h (6:30-14:00)               │
│ "Thu Na N"      → 8h   (14:00-22:00)               │
│ "Lan 10h-18h"   → 4h   (custom hours)              │
│ "Nhật M"        → 8.5h (6:30-15:00)                │
├─────────────────────────────────────────────────────┤
│ PRIORITY 2: Column position (fallback for Ca 3)    │
├─────────────────────────────────────────────────────┤
│ Column 2 (Ca 3)  → 4h   (18:00-22:00)  ← Only     │
│ Column 0,1      → null (no shift info)             │
└─────────────────────────────────────────────────────┘

Sheet structure: | Ca 1 | Ca 2 | Ca 3 | ...
```

### Shift Hour Calculations

| Method | Pattern/Column | Hours | Time Range |
|--------|----------------|-------|------------|
| Content | "X M - 14h" | 7.5h | 6:30-14:00 |
| Content | "X M" | 8.5h | 6:30-15:00 |
| Content | "X N" | 8h | 14:00-22:00 |
| Column | Ca 3 (col 2) | 4h | 18:00-22:00 |
| Content | "X h-h" | Variable | Custom |

### Data Flow (UPDATED)

```
App loads (from .env: NEXT_PUBLIC_SHEET_URL)
    ↓
Check localStorage for cached schedule
    ↓
IF cache exists → Load cached data
ELSE → Fetch from Google Sheets
    ↓
API fetches CSV from ALL sheets/tabs
    ↓
Parser extracts shifts and employees
    ↓
Save schedule to localStorage (cache)
    ↓
User enters hourly wages (saved to localStorage)
    ↓
Calculator groups by month and aggregates hours × wage
    ↓
Month range: day 1 to last day of month
    ↓
Results displayed with month filter
    ↓
User clicks "Cập nhật lịch" button → Refetch (optional)
```

---

## Command Reference

### Setup
```bash
npx create-next-app@latest salary-calculator --typescript --tailwind --app --eslint
cd salary-calculator
npm install papaparse date-fns sonner lucide-react
npm install -D @types/papaparse
npx shadcn@latest init
npx shadcn@latest add button input card table label alert dialog badge skeleton

# Create .env.local with sheet URL
echo "NEXT_PUBLIC_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit" > .env.local
```

### Development
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## Testing Checklist

### Functionality
- [ ] Import public Google Sheet successfully
- [ ] **Fetch from ALL sheets/tabs in workbook** (NEW)
- [ ] Parse all shift patterns correctly
- [ ] Calculate accurate hours per shift
- [ ] **Group shifts by month correctly** (NEW)
- [ ] Aggregate hours by employee
- [ ] Calculate salary = hours × wage
- [ ] Persist wages across page reloads
- [ ] **Month selector navigation works** (NEW)
- [ ] **Month filter applies to summary correctly** (NEW)
- [ ] **"All months" view shows aggregated data** (NEW)
- [ ] Print/Save PDF button works

### Error Handling
- [ ] Invalid URL format shows error
- [ ] Private sheet shows helpful message
- [ ] Empty sheet handled gracefully
- [ ] Network errors handled

### UI/UX
- [ ] Loading states during import
- [ ] Responsive on mobile/desktop
- [ ] Tables scroll on mobile
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast sufficient

---
## localStorage Contents

| Key | Data | Description |
|-----|------|-------------|
| `salary-calculator-wages` | EmployeeWage[] | Mức lương giờ của từng nhân viên |
| `salary-calculator-sheet-data` | ParsedSchedule | **Dữ liệu schedule đã cache** |
| `salary-calculator-last-fetch` | ISO timestamp | Thời gian fetch lần cuối |

**Behavior:**
- First load: Fetch from Google Sheets → Save to localStorage
- Subsequent loads: Load from localStorage (instant)
- Click "Cập nhật lịch": Refetch from Google Sheets → Update cache

---

## Deployment Notes

### Vercel (Recommended)
- Edge runtime enabled
- No environment variables needed
- Automatic HTTPS
- Free tier sufficient

### Build Output
- Static generation where possible
- Edge functions for API route
- ~200KB initial bundle (estimated)

---

## Post-MVP Enhancements

1. ~~**Multi-sheet support**: Select which sheet from workbook~~ → **IMPLEMENTED** ✅
2. ~~**Month selector**: Handle multi-month schedules~~ → **IMPLEMENTED** ✅
3. **Employee name normalization**: Fuzzy matching for typos
4. **Overtime calculation**: Different rates for overtime hours
5. **PDF export**: Generate printable salary reports (Print button added)
6. **Dark mode**: Theme toggle (UI ready, just needs toggle button)
7. **Data persistence**: Backend for multi-user support
8. **Sheet structure detection**: Auto-detect row/column orientation
9. **Auto-load last sheet**: Restore last used URL on app load

---

## Unresolved Questions

1. **Sheet URL persistence**: Should we remember the last used URL?
   - Answer: Yes, add to localStorage if frequently used

2. **Currency**: Should we support other currencies besides VND?
   - Answer: MVP VND only, make configurable later

3. **Multiple positions per employee**: If employee works in different roles?
   - Answer: MVP treats as same employee, aggregates all hours

4. **Sheet access token**: For private sheets?
   - Answer: MVP requires public sheets, OAuth is post-MVP

---

## Links to Detailed Plans

- [Phase 1: Project Setup](./phase-01-project-setup.md)
- [Phase 2: Core Logic](./phase-02-core-logic.md)
- [Phase 3: API Endpoint](./phase-03-api-endpoint.md)
- [Phase 4: UI Components](./phase-04-ui-components.md)
- [Phase 5: Main Page Integration](./phase-05-main-page-integration.md)
- [Phase 6: Polish and Error Handling](./phase-06-polish-and-error-handling.md)
