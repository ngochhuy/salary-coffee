# Phase 5: Main Page Integration

## Overview
Integrate all components into the main page with state management and data flow.

---

## 5.1 Root Layout (`app/layout.tsx`)

### Implementation

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Salary Calculator | Coffee Shop',
  description: 'Calculate employee salaries from Google Sheets schedule',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 5.2 Main Page (`app/page.tsx`)

### Implementation

```typescript
'use client';

import { useState, useMemo, useEffect } from 'react';
import { SheetImport } from '@/components/sheet-import';
import { ScheduleTable } from '@/components/schedule-table';
import { WageInput } from '@/components/wage-input';
import { SalarySummary } from '@/components/salary-summary';
import { ParsedSchedule, EmployeeWage, SalaryCalculation } from '@/types';
import { calculateSalaries, extractEmployees } from '@/lib/salary-calculator';
import { getWages, setSheetUrl, getSheetUrl } from '@/lib/storage';

export default function HomePage() {
  // State
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null);
  const [wages, setWages] = useState<EmployeeWage[]>([]);
  const [calculations, setCalculations] = useState<SalaryCalculation[]>([]);

  // Load saved data on mount
  useEffect(() => {
    // Restore wages from localStorage
    const savedWages = getWages();
    setWages(savedWages);

    // Could auto-load last sheet URL here if desired
    // const savedUrl = getSheetUrl();
  }, []);

  // Extract employees from schedule
  const employees = useMemo(() => {
    return schedule ? extractEmployees(schedule) : [];
  }, [schedule]);

  // Recalculate salaries when schedule or wages change
  useEffect(() => {
    if (schedule && wages.length > 0) {
      const results = calculateSalaries(schedule, wages);
      setCalculations(results);
    } else {
      setCalculations([]);
    }
  }, [schedule, wages]);

  // Handle schedule import
  const handleImport = (importedSchedule: ParsedSchedule) => {
    setSchedule(importedSchedule);

    // Merge imported employees with existing wages
    const importedEmployees = extractEmployees(importedSchedule);
    const mergedWages = importedEmployees.map((emp) => {
      const existing = wages.find((w) => w.employeeName === emp);
      return {
        employeeName: emp,
        hourlyWage: existing?.hourlyWage || 0,
      };
    });

    setWages(mergedWages);
  };

  // Handle wage changes
  const handleWageChange = (updatedWages: EmployeeWage[]) => {
    setWages(updatedWages);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Salary Calculator
          </h1>
          <p className="text-muted-foreground">
            Import your coffee shop schedule from Google Sheets and calculate salaries
          </p>
        </header>

        {/* Sheet Import - Always Visible */}
        <SheetImport onImport={handleImport} />

        {/* Main Content - Show After Import */}
        {schedule && (
          <div className="space-y-8">
            {/* Schedule Display */}
            <ScheduleTable schedule={schedule} />

            {/* Two Column Layout for Wage Input and Summary */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Wage Input */}
              <WageInput
                employees={employees}
                onWagesChange={handleWageChange}
              />

              {/* Salary Summary */}
              <SalarySummary calculations={calculations} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!schedule && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Import a schedule to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
```

---

## 5.3 Global Styles (`app/globals.css`)

### Implementation

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar for tables */
@layer utilities {
  .scrollbar-thin::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-muted;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-md;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}
```

---

## 5.4 Data Flow Diagram

```
User Action: Import Sheet
    ↓
SheetImport.onImport(schedule)
    ↓
setSchedule(importedSchedule)
    ↓
extractEmployees(schedule)
    ↓
merge with existing wages
    ↓
setWages(mergedWages)
    ↓
useEffect triggers calculateSalaries()
    ↓
setCalculations(results)
    ↓
UI updates: ScheduleTable + WageInput + SalarySummary

User Action: Change Wage
    ↓
WageInput.onChange(employee, wage)
    ↓
updateWage() → localStorage
    ↓
onWagesChange(updatedWages)
    ↓
setWages(updatedWages)
    ↓
useEffect triggers calculateSalaries()
    ↓
setCalculations(results)
    ↓
UI updates: SalarySummary
```

---

## 5.5 Missing Badge Component

**Need to add Badge component from shadcn/ui:**

```bash
npx shadcn@latest add badge
```

Or create manually at `components/ui/badge.tsx` using shadcn/ui documentation.

---

## Verification Checklist

- [ ] Page loads without errors
- [ ] Layout renders correctly with header
- [ ] SheetImport card displays on initial load
- [ ] Empty state shows when no schedule imported
- [ ] After import, all three main components appear
- [ ] ScheduleTable shows imported data
- [ ] WageInput lists all employees
- [ ] Wage changes update calculations immediately
- [ ] SalarySummary displays aggregated results
- [ ] Two-column layout works on large screens
- [ ] Stack to single column on mobile
- [ ] Page reload preserves wages from localStorage

---

## Dependencies

**Depends on:** Phase 4 (UI Components), Phase 2 (Core Logic), Phase 3 (API)

**Required for:** Phase 6 (Polish)

---

## Estimated Time

**Total: 2 hours**
- Root layout: 15 min
- Main page integration: 1h
- Global styles: 15 min
- Testing data flow: 30 min
