# Salary Calculator Implementation Summary

## Quick Reference

**Project**: Salary Calculator for Coffee Shop
**Tech Stack**: Next.js 15 + TypeScript + shadcn/ui + Tailwind CSS
**Total Estimated Time**: 16 hours
**Current Status**: Ready to Implement

---

## File Structure Overview

```
salary-calculator/
├── app/
│   ├── api/sheets/
│   │   └── route.ts              # Phase 3: API endpoint
│   ├── layout.tsx                # Phase 5: Root layout
│   ├── page.tsx                  # Phase 5: Main dashboard
│   └── globals.css              # Phase 5: Global styles
├── components/
│   ├── ui/                       # shadcn/ui components (Phase 1)
│   ├── sheet-import.tsx         # Phase 4: URL input form
│   ├── schedule-table.tsx       # Phase 4: Schedule display
│   ├── wage-input.tsx           # Phase 4: Wage inputs
│   └── salary-summary.tsx       # Phase 4: Results display
├── lib/
│   ├── constants.ts              # Phase 2: Shift mappings
│   ├── sheets-parser.ts         # Phase 2: CSV parsing
│   ├── salary-calculator.ts     # Phase 2: Calculation engine
│   ├── storage.ts               # Phase 2: localStorage wrapper
│   └── api.ts                   # Phase 3: API helper
└── types/
    └── index.ts                  # Phase 2: Type definitions
```

---

## Phase-by-Phase Overview

| Phase | Title | Time | Key Outputs |
|-------|-------|------|-------------|
| 1 | Project Setup | 2h | Next.js project, shadcn/ui, folder structure |
| 2 | Core Logic | 4h | Parser, calculator, storage, types |
| 3 | API Endpoint | 2h | `/api/sheets` route |
| 4 | UI Components | 5h | 4 React components |
| 5 | Integration | 2h | Main page with state management |
| 6 | Polish | 1h | Error handling, responsive, accessibility |

---

## Key Implementation Details

### Shift Parsing Patterns

```typescript
// Format examples parsed correctly:
"Nhật M - 14h"   → Morning shift ending 14:00
"Thu Na N"       → Afternoon shift
"Lan 10h-18h"    → Custom hours
"Thuý"           → Name only (no shift info)
```

### Shift Hour Calculations

| Shift Type | Hours | Time Range |
|------------|-------|------------|
| M (default) | 8.5h | 6:30-15:00 |
| M - 14h | 7.5h | 6:30-14:00 |
| N | 8h | 14:00-22:00 |
| Full day | 16h | 6:00-22:00 |
| Custom | Variable | User-specified |

### Data Flow

```
User inputs sheet URL
    ↓
API fetches CSV from Google Sheets
    ↓
Parser extracts shifts and employees
    ↓
User enters hourly wages (saved to localStorage)
    ↓
Calculator aggregates hours × wage per employee
    ↓
Results displayed in salary summary table
```

---

## Command Reference

### Setup
```bash
npx create-next-app@latest salary-calculator --typescript --tailwind --app --eslint
cd salary-calculator
npm install papaparse date-fns sonner
npm install -D @types/papaparse
npx shadcn@latest init
npx shadcn@latest add button input card table label alert dialog badge skeleton
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
- [ ] Parse all shift patterns correctly
- [ ] Calculate accurate hours per shift
- [ ] Aggregate hours by employee
- [ ] Calculate salary = hours × wage
- [ ] Persist wages across page reloads
- [ ] Export salary summary to CSV

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

1. **Multi-sheet support**: Select which sheet from workbook
2. **Employee name normalization**: Fuzzy matching for typos
3. **Overtime calculation**: Different rates for overtime hours
4. **PDF export**: Generate printable salary reports
5. **Month selector**: Handle multi-month schedules
6. **Dark mode**: Theme toggle (UI ready, just needs toggle button)
7. **Data persistence**: Backend for multi-user support
8. **Sheet structure detection**: Auto-detect row/column orientation

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
