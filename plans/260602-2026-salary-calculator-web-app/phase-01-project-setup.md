# Phase 1: Project Setup

## Overview
Initialize Next.js project with TypeScript, Tailwind CSS, and shadcn/ui components.

---

## Tasks

### 1.1 Initialize Next.js Project

**Command:**
```bash
cd D:/WorkSpace/Learn/AI/SelfProject/salary-coffee
npx create-next-app@latest salary-calculator --typescript --tailwind --app --eslint
```

**Interactive prompts:**
- Would you like to use TypeScript? → Yes
- Would you like to use ESLint? → Yes
- Would you like to use Tailwind CSS? → Yes
- Would you like to use `src/` directory? → No
- Would you like to use App Router? → Yes
- Would you like to customize the default import alias (@/*)? → Yes

**Expected output:**
```
D:/WorkSpace/Learn/AI/SelfProject/salary-coffee/salary-calculator/
├── app/
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

### 1.2 Install Dependencies

**Command:**
```bash
cd salary-calculator
npm install papaparse date-fns
npm install -D @types/papaparse
```

**Purpose:**
- `papaparse`: Parse CSV from Google Sheets export
- `date-fns`: Date manipulation for month calculations
- `@types/papaparse`: TypeScript types for papaparse

---

### 1.3 Setup shadcn/ui

**Step 1: Initialize shadcn/ui**
```bash
npx shadcn@latest init
```

**Configuration:**
- Which style would you like to use? → Default
- Which color would you like to use? → Slate
- Do you want to use CSS variables for colors? → Yes

**Step 2: Add components**
```bash
npx shadcn@latest add button input card table label textarea alert dialog
```

**Components added:**
- `button` - Import action, form submits
- `input` - Sheet URL, wage inputs
- `card` - Container components
- `table` - Schedule/salary display
- `label` - Form labels
- `textarea` - Error messages (optional)
- `alert` - Error/success notifications
- `dialog` - Confirmations (future)

**Expected structure:**
```
components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── table.tsx
├── label.tsx
├── textarea.tsx
├── alert.tsx
└── dialog.tsx
```

---

### 1.4 Create Folder Structure

**Commands:**
```bash
# Create directories
mkdir -p app/api/sheets
mkdir -p components
mkdir -p lib
mkdir -p types
```

**Expected structure:**
```
salary-calculator/
├── app/
│   ├── api/
│   │   └── sheets/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/              # shadcn components
│   ├── sheet-import.tsx
│   ├── schedule-table.tsx
│   ├── wage-input.tsx
│   └── salary-summary.tsx
├── lib/
│   ├── sheets-parser.ts
│   ├── salary-calculator.ts
│   ├── storage.ts
│   └── constants.ts
├── types/
│   └── index.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## Files to Create (Empty Stubs)

After setup, create these empty files with basic exports:

### `types/index.ts`
```typescript
// Type definitions will be added in Phase 2
export {};
```

### `lib/constants.ts`
```typescript
// Shift hour constants will be added in Phase 2
export {};
```

### `lib/storage.ts`
```typescript
// localStorage utilities will be added in Phase 2
export {};
```

### `lib/sheets-parser.ts`
```typescript
// CSV parsing logic will be added in Phase 2
export {};
```

### `lib/salary-calculator.ts`
```typescript
// Salary calculation logic will be added in Phase 2
export {};
```

### `app/api/sheets/route.ts`
```typescript
// API endpoint will be added in Phase 3
export {};
```

### `components/sheet-import.tsx`
```typescript
// Sheet import component will be added in Phase 4
export {};
```

### `components/schedule-table.tsx`
```typescript
// Schedule table component will be added in Phase 4
export {};
```

### `components/wage-input.tsx`
```typescript
// Wage input component will be added in Phase 4
export {};
```

### `components/salary-summary.tsx`
```typescript
// Salary summary component will be added in Phase 4
export {};
```

---

## Verification Checklist

- [ ] `npm run dev` starts successfully
- [ ] Browser opens to http://localhost:3000
- [ ] shadcn/ui components render correctly
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes with no errors
- [ ] Folder structure matches plan

---

## Dependencies

**Depends on:** Nothing (first phase)

**Required for:** All subsequent phases

---

## Estimated Time

**Total: 2 hours**
- Project initialization: 30 min
- Dependency installation: 15 min
- shadcn/ui setup: 45 min
- Folder structure & stubs: 30 min
