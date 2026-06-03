'use client';

import { useState } from 'react';
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const min = Math.round((hours - h) * 60);
  return min > 0 ? `${h}h ${min}p` : `${h}h`;
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
          <p className="text-muted-foreground">Không có dữ liệu để hiển thị.</p>
        </CardContent>
      </Card>
    );
  }

  const totalSalary = displayData.reduce((sum, m) => sum + m.totalSalary, 0);
  const totalAllowance = displayData.reduce((sum, m) => sum + m.totalAllowance, 0);
  const totalFinalSalary = displayData.reduce((sum, m) => sum + m.finalSalary, 0);
  const totalHours = displayData.reduce((sum, m) => sum + m.totalHours, 0);

  const handleEmployeeClick = (employee: SalaryCalculation, monthLabel: string) => {
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

              <div className="rounded-md border overflow-x-auto scrollbar-thin">
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
                        onClick={() => handleEmployeeClick(emp, month.monthLabel)}
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
              <span className="flex gap-4 flex-wrap justify-end">
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
