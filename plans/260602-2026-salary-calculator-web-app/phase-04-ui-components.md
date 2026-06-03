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

## 4.5 Month Selector Component (`components/month-selector.tsx`) - NEW

### Implementation

```typescript
'use client';

import { MonthlySalaryCalculation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  monthlyData: MonthlySalaryCalculation[];
  selectedMonth: string | 'all';
  onMonthChange: (month: string | 'all') => void;
}

export function MonthSelector({
  monthlyData,
  selectedMonth,
  onMonthChange,
}: MonthSelectorProps) {
  const months = ['all', ...monthlyData.map((m) => m.month)];
  const currentIndex = months.indexOf(selectedMonth);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onMonthChange(months[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < months.length - 1) {
      onMonthChange(months[currentIndex + 1]);
    }
  };

  const getCurrentLabel = () => {
    if (selectedMonth === 'all') return 'Tất cả các tháng';
    const month = monthlyData.find((m) => m.month === selectedMonth);
    return month?.monthLabel || selectedMonth;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chọn Tháng</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-4 py-2 text-base">
              {getCurrentLabel()}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === months.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedMonth === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMonthChange('all')}
          >
            Tất cả ({monthlyData.length} tháng)
          </Button>
          {monthlyData.map((month) => (
            <Button
              key={month.month}
              variant={selectedMonth === month.month ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMonthChange(month.month)}
            >
              {month.monthLabel}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4.6 Monthly Salary Summary Component (`components/monthly-salary-summary.tsx`) - NEW

### Implementation

```typescript
'use client';

import { MonthlySalaryCalculation, SalaryCalculation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeDetailDialog } from '@/components/employee-detail-dialog';

interface MonthlySalarySummaryProps {
  monthlyData: MonthlySalaryCalculation[];
  selectedMonth: string | 'all';
}

interface MonthlySalaryCalculation {
  month: string;
  monthLabel: string;
  employees: SalaryCalculation[];
  totalHours: number;
  totalSalary: number;
  totalAllowance: number;
  finalSalary: number;
  dateRange: { start: string; end: string };
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

export function MonthlySalarySummary({
  monthlyData,
  selectedMonth,
}: MonthlySalarySummaryProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<SalaryCalculation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayData =
    selectedMonth === 'all'
      ? monthlyData
      : monthlyData.filter((m) => m.month === selectedMonth);

  if (displayData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bảng Lương</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data to display.</p>
        </CardContent>
      </Card>
    );
  }

  const totalSalary = displayData.reduce((sum, m) => sum + m.totalSalary, 0);
  const totalAllowance = displayData.reduce((sum, m) => sum + m.totalAllowance, 0);
  const totalFinalSalary = displayData.reduce((sum, m) => sum + m.finalSalary, 0);
  const totalHours = displayData.reduce((sum, m) => sum + m.totalHours, 0);

  const handleEmployeeClick = (employee: SalaryCalculation) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const getMonthLabelForEmployee = () => {
    if (selectedMonth !== 'all') {
      const month = monthlyData.find(m => m.month === selectedMonth);
      return month?.monthLabel;
    }
    return selectedMonth;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bảng Lương</CardTitle>
            <Button onClick={() => window.print()} variant="outline" size="sm">
              In / Lưu PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayData.map((month) => (
            <div key={month.month} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-lg font-semibold">{month.monthLabel}</h3>
                  <p className="text-xs text-muted-foreground">
                    {month.dateRange.start} đến {month.dateRange.end}
                  </p>
                </div>
                <Badge variant="secondary">
                  {month.employees.length} nhân viên
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead className="text-right">Ngày làm</TableHead>
                      <TableHead className="text-right">Tổng giờ</TableHead>
                      <TableHead className="text-right">Lương cơ bản</TableHead>
                      <TableHead className="text-right">Trợ cấp</TableHead>
                      <TableHead className="text-right">Tổng nhận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {month.employees.map((emp) => (
                      <TableRow
                        key={emp.employeeName}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEmployeeClick(emp)}
                      >
                        <TableCell className="font-medium">
                          {emp.employeeName}
                          <span className="ml-2 text-xs text-muted-foreground">👁️</span>
                        </TableCell>
                        <TableCell className="text-right">{emp.daysWorked}</TableCell>
                        <TableCell className="text-right">{formatHours(emp.totalHours)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(emp.totalSalary)}</TableCell>
                        <TableCell className="text-right text-green-600">
                          +{formatCurrency(emp.totalAllowance)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(emp.finalSalary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end text-sm text-muted-foreground space-x-4">
                <span>Tổng tháng {month.monthLabel}:</span>
                <span>{formatHours(month.totalHours)}</span>
                <span className="text-blue-600">Cơ bản: {formatCurrency(month.totalSalary)}</span>
                <span className="text-green-600">+ Trợ cấp: {formatCurrency(month.totalAllowance)}</span>
                <span className="font-bold">= {formatCurrency(month.finalSalary)}</span>
              </div>
            </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Tổng cộng:</span>
            <span className="flex gap-4">
              <span>{formatHours(totalHours)}</span>
              <span className="text-blue-600">{formatCurrency(totalSalary)}</span>
              <span className="text-green-600">+{formatCurrency(totalAllowance)}</span>
              <span className="text-primary font-bold">= {formatCurrency(totalFinalSalary)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

      <EmployeeDetailDialog
        employee={selectedEmployee}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        monthLabel={getMonthLabelForEmployee()}
      />
    </>
  );
}
```

---

## 4.7 Employee Detail Dialog (`components/employee-detail-dialog.tsx`) - NEW

### Implementation

```typescript
'use client';

import { SalaryCalculation } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmployeeDetailDialogProps {
  employee: SalaryCalculation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthLabel?: string;
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

const SHIFT_TYPE_LABELS: Record<string, string> = {
  'M-14h': 'Ca Sáng (6:30-14:00)',
  'M': 'Ca Sáng (6:30-15:00)',
  'N': 'Ca Chiều (14:00-22:00)',
  'ca3': 'Ca 3 (18:00-22:00)',
  'custom': 'Tùy chỉnh',
  'unknown': 'Không xác định',
};

export function EmployeeDetailDialog({
  employee,
  open,
  onOpenChange,
  monthLabel,
}: EmployeeDetailDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{employee.employeeName}</DialogTitle>
          <DialogDescription>
            Chi tiết lương tháng {monthLabel || 'hiện tại'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng giờ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(employee.totalHours)}</div>
                <div className="text-xs text-muted-foreground">{employee.daysWorked} ngày làm</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lương cơ bản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(employee.totalSalary)}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(employee.hourlyWage)}/giờ</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trợ cấp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(employee.totalAllowance)}</div>
                <div className="text-xs text-muted-foreground">Ca > 7h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhận</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(employee.finalSalary)}</div>
                <div className="text-xs text-muted-foreground">Cơ bản + Trợ cấp</div>
              </CardContent>
            </Card>
          </div>

          {/* Shift Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê ca làm việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{employee.shiftBreakdown['M-14h']}</div>
                  <div className="text-xs text-muted-foreground">Ca M - 14h</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{employee.shiftBreakdown['M']}</div>
                  <div className="text-xs text-muted-foreground">Ca M</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{employee.shiftBreakdown['N']}</div>
                  <div className="text-xs text-muted-foreground">Ca N</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{employee.shiftBreakdown['ca3']}</div>
                  <div className="text-xs text-muted-foreground">Ca 3</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{employee.shiftBreakdown['custom']}</div>
                  <div className="text-xs text-muted-foreground">Tùy chỉnh</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shift Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết từng ca</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại ca</TableHead>
                    <TableHead className="text-right">Số giờ</TableHead>
                    <TableHead className="text-right">Trợ cấp</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.shifts.map((shift, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{shift.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{SHIFT_TYPE_LABELS[shift.shiftType] || shift.shiftType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatHours(shift.hours)}</TableCell>
                      <TableCell className="text-right">
                        {shift.allowance > 0 ? (
                          <span className="text-green-600">+{formatCurrency(shift.allowance)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(shift.hours * employee.hourlyWage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---
## Component Dependencies

```
SheetImport (removed - URL from .env)
  
ScheduleTable
  ├─ Table (shadcn/ui)
  └─ Badge (shadcn/ui)

WageInput
  ├─ Card, Label, Input (shadcn/ui)
  └─ updateWage, getWages (lib/storage.ts)

MonthSelector (NEW)
  ├─ Card, Button, Badge (shadcn/ui)
  └─ lucide-react icons

MonthlySalarySummary (UPDATED)
  ├─ Card, Table, Button, Badge, Dialog (shadcn/ui)
  └─ MonthlySalaryCalculation type

EmployeeDetailDialog (NEW)
  ├─ Dialog, Card, Table, Badge (shadcn/ui)
  └─ SalaryCalculation type
```

---

## Verification Checklist

- [ ] ScheduleTable renders all rows and columns
- [ ] Shift badges show correct colors
- [ ] WageInput loads saved wages from localStorage
- [ ] Wage changes persist immediately
- [ ] MonthSelector shows all available months
- [ ] MonthSelector navigation buttons work correctly
- [ ] MonthSelector filter applies to MonthlySalarySummary
- [ ] MonthlySalarySummary displays grouped by month
- [ ] MonthlySalarySummary "All months" view works
- [ ] MonthlySalarySummary shows Base salary + Allowance breakdown (NEW)
- [ ] MonthlySalarySummary total calculations include allowances (NEW)
- [ ] Click on employee row opens EmployeeDetailDialog (NEW)
- [ ] EmployeeDetailDialog shows shift breakdown (M-14h, M, N, ca3 counts) (NEW)
- [ ] EmployeeDetailDialog shows detailed shift list with allowance per shift (NEW)
- [ ] EmployeeDetailDialog shows correct totals (hours, base salary, allowance, final) (NEW)
- [ ] Print/Save PDF button works

---

## Dependencies

**Depends on:** Phase 2 (Core Logic), Phase 3 (API Endpoint)

**Required for:** Phase 5 (Main Page Integration)

---

## Estimated Time

**Total: 8 hours** (updated)
- ScheduleTable: 1.5h
- WageInput: 1h
- MonthSelector: 1h
- MonthlySalarySummary: 2.5h (updated with allowance display)
- EmployeeDetailDialog: 2h (NEW)
