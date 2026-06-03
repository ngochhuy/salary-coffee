# Phase 4: UI Components

## Overview
Build React components for the user interface using shadcn/ui primitives.

---

## 4.1 Sheet Import Component (`components/sheet-import.tsx`)

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { importSheet } from '@/lib/api';
import { ParsedSchedule } from '@/types';

interface SheetImportProps {
  onImport: (schedule: ParsedSchedule) => void;
}

export function SheetImport({ onImport }: SheetImportProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await importSheet(url);

      if (result.success && result.data) {
        onImport(result.data);
        setUrl(''); // Clear input on success
      } else {
        setError(result.error || 'Failed to import schedule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Schedule</CardTitle>
        <CardDescription>
          Paste your Google Sheets URL to import the work schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sheet-url">Google Sheets URL</Label>
          <Input
            id="sheet-url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <p className="text-xs text-muted-foreground">
            Sheet must be publicly accessible (File → Share → Anyone with the link)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleImport} disabled={loading} className="w-full">
          {loading ? 'Importing...' : 'Import Schedule'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 4.2 Schedule Table Component (`components/schedule-table.tsx`)

### Implementation

```typescript
'use client';

import { ParsedSchedule, ShiftData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ScheduleTableProps {
  schedule: ParsedSchedule;
}

function ShiftCell({ shift }: { shift: ShiftData }) {
  if (!shift.employee) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getShiftVariant = (type: string | null) => {
    switch (type) {
      case 'M': return 'default';
      case 'N': return 'secondary';
      case 'full': return 'outline';
      case 'custom': return 'destructive';
      default: return 'default';
    }
  };

  const getShiftLabel = (shift: ShiftData) => {
    if (shift.shiftType === 'custom' && shift.customHours) {
      return `${shift.customHours.start}h-${shift.customHours.end}h`;
    }
    return shift.shiftType || '?';
  };

  return (
    <div className="space-y-1">
      <div className="font-medium">{shift.employee}</div>
      {shift.shiftType && (
        <Badge variant={getShiftVariant(shift.shiftType)} className="text-xs">
          {getShiftLabel(shift)}
        </Badge>
      )}
    </div>
  );
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Position</TableHead>
                {schedule.days.map((day) => (
                  <TableHead key={day} className="min-w-[120px]">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.positions.map((position, rowIdx) => (
                <TableRow key={position}>
                  <TableCell className="font-medium">{position}</TableCell>
                  {schedule.cells[rowIdx]?.map((cell, colIdx) => (
                    <TableCell key={`${rowIdx}-${colIdx}`}>
                      <ShiftCell shift={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4.3 Wage Input Component (`components/wage-input.tsx`)

### Implementation

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeWage } from '@/types';
import { updateWage, getWages } from '@/lib/storage';

interface WageInputProps {
  employees: string[];
  onWagesChange?: (wages: EmployeeWage[]) => void;
}

export function WageInput({ employees, onWagesChange }: WageInputProps) {
  const [wages, setWages] = useState<Record<string, number>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  // Load existing wages from localStorage on mount
  useEffect(() => {
    const savedWages = getWages();
    const wageMap: Record<string, number> = {};
    savedWages.forEach((w) => {
      wageMap[w.employeeName] = w.hourlyWage;
    });
    setWages(wageMap);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    const wageList: EmployeeWage[] = employees.map((name) => ({
      employeeName: name,
      hourlyWage: wages[name] || 0,
    }));
    onWagesChange?.(wageList);
  }, [wages, employees, onWagesChange]);

  const handleWageChange = (employee: string, value: string) => {
    const wageValue = parseFloat(value) || 0;
    setWages((prev) => ({ ...prev, [employee]: wageValue }));
    setUnsavedChanges((prev) => new Set(prev).add(employee));

    // Save to localStorage immediately
    updateWage(employee, wageValue);
    setUnsavedChanges((prev) => {
      const next = new Set(prev);
      next.delete(employee);
      return next;
    });
  };

  if (employees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Wages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee} className="flex items-center gap-4">
              <Label htmlFor={`wage-${employee}`} className="w-48">
                {employee}
              </Label>
              <Input
                id={`wage-${employee}`}
                type="number"
                min="0"
                step="500"
                placeholder="0"
                value={wages[employee] || ''}
                onChange={(e) => handleWageChange(employee, e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">VNĐ/hour</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4.4 Salary Summary Component (`components/salary-summary.tsx`)

### Implementation

```typescript
'use client';

import { SalaryCalculation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface SalarySummaryProps {
  calculations: SalaryCalculation[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const min = Math.round((hours - h) * 60);
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

export function SalarySummary({ calculations }: SalarySummaryProps) {
  const totalSalary = calculations.reduce((sum, c) => sum + c.totalSalary, 0);
  const totalHours = calculations.reduce((sum, c) => sum + c.totalHours, 0);

  const exportToCSV = () => {
    const headers = ['Employee', 'Days Worked', 'Total Hours', 'Hourly Wage', 'Total Salary'];
    const rows = calculations.map((c) => [
      c.employeeName,
      c.daysWorked.toString(),
      c.totalHours.toFixed(2),
      c.hourlyWage.toString(),
      c.totalSalary.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-calculation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (calculations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salary Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Import a schedule and set wages to see calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Salary Summary</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Days Worked</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Hourly Wage</TableHead>
                <TableHead className="text-right">Total Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow key={calc.employeeName}>
                  <TableCell className="font-medium">{calc.employeeName}</TableCell>
                  <TableCell className="text-right">{calc.daysWorked}</TableCell>
                  <TableCell className="text-right">{formatHours(calc.totalHours)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(calc.hourlyWage)}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(calc.totalSalary)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell />
                <TableCell className="text-right font-bold">{formatHours(totalHours)}</TableCell>
                <TableCell />
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(totalSalary)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Component Dependencies

```
SheetImport
  ├─ Button, Input, Card, Label, Alert (shadcn/ui)
  └─ importSheet (lib/api.ts)

ScheduleTable
  ├─ Table (shadcn/ui)
  └─ Badge (shadcn/ui)

WageInput
  ├─ Card, Label, Input (shadcn/ui)
  └─ updateWage, getWages (lib/storage.ts)

SalarySummary
  ├─ Table, Button (shadcn/ui)
  └─ (no lib dependencies)
```

---

## Verification Checklist

- [ ] SheetImport renders without errors
- [ ] URL input accepts and validates URLs
- [ ] Loading state shows during import
- [ ] Error messages display correctly
- [ ] ScheduleTable renders all rows and columns
- [ ] Shift badges show correct colors
- [ ] WageInput loads saved wages from localStorage
- [ ] Wage changes persist immediately
- [ ] SalarySummary displays all calculations
- [ ] CSV export downloads file correctly
- [ ] Currency formatting works for VND

---

## Dependencies

**Depends on:** Phase 2 (Core Logic), Phase 3 (API Endpoint)

**Required for:** Phase 5 (Main Page Integration)

---

## Estimated Time

**Total: 5 hours**
- SheetImport: 1h
- ScheduleTable: 1.5h
- WageInput: 1h
- SalarySummary: 1.5h
