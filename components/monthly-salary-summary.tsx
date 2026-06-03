'use client';

import { useState } from 'react';
import { MonthlySalaryCalculation, SalaryCalculation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeDetailDialog } from '@/components/employee-detail-dialog';
import { Calculator, Printer } from 'lucide-react';

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
      <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-amber-700" />
            </div>
            <CardTitle className="text-amber-900 font-heading">Bảng Lương</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-amber-700/70">Không có dữ liệu để hiển thị.</p>
          </div>
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
      <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-amber-700" />
              </div>
              <CardTitle className="text-amber-900 font-heading">Bảng Lương</CardTitle>
            </div>
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
              className="border-amber-200 hover:bg-amber-50 text-amber-800 press-effect"
            >
              <Printer className="h-4 w-4 mr-1" />
              In / Lưu PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayData.map((month) => (
            <div key={month.month} className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">{month.monthLabel}</h3>
                  <p className="text-xs text-amber-700/70">
                    {month.dateRange.start} đến {month.dateRange.end}
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  {month.employees.length} nhân viên
                </Badge>
              </div>

              <div className="rounded-xl border border-amber-200 overflow-hidden bg-white/50">
                <Table>
                  <TableHeader className="bg-amber-50/50">
                    <TableRow className="hover:bg-amber-50/50 border-amber-200">
                      <TableHead className="text-amber-900 font-semibold">Nhân viên</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Ngày làm</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Tổng giờ</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Lương cơ bản</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Trợ cấp</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Tổng nhận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {month.employees.map((emp) => (
                      <TableRow
                        key={emp.employeeName}
                        className="cursor-pointer hover:bg-amber-50/80 transition-colors border-amber-100"
                        onClick={() => handleEmployeeClick(emp, month.monthLabel)}
                      >
                        <TableCell className="font-medium text-amber-900">
                          {emp.employeeName}
                          <span className="ml-2 text-xs text-amber-600 opacity-60">👁️</span>
                        </TableCell>
                        <TableCell className="text-right text-amber-800">{emp.daysWorked}</TableCell>
                        <TableCell className="text-right text-amber-800">{formatHours(emp.totalHours)}</TableCell>
                        <TableCell className="text-right text-amber-800">{formatCurrency(emp.totalSalary)}</TableCell>
                        <TableCell className="text-right text-green-700 font-medium">
                          +{formatCurrency(emp.totalAllowance)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-900">
                          {formatCurrency(emp.finalSalary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end text-sm text-amber-700 space-x-4 bg-amber-50/50 rounded-lg p-3">
                <span className="font-medium">Tổng tháng {month.monthLabel}:</span>
                <span>{formatHours(month.totalHours)}</span>
                <span className="text-amber-800">Cơ bản: {formatCurrency(month.totalSalary)}</span>
                <span className="text-green-700">+ Trợ cấp: {formatCurrency(month.totalAllowance)}</span>
                <span className="font-bold text-amber-900">= {formatCurrency(month.finalSalary)}</span>
              </div>
            </div>
          ))}

          <div className="border-t-2 border-amber-300 pt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-amber-900">Tổng cộng:</span>
              <span className="flex gap-3 sm:gap-4 flex-wrap justify-end">
                <span className="text-amber-800">{formatHours(totalHours)}</span>
                <span className="text-amber-900">{formatCurrency(totalSalary)}</span>
                <span className="text-green-700 font-medium">+{formatCurrency(totalAllowance)}</span>
                <span className="font-bold text-amber-900 text-xl bg-gradient-to-r from-amber-700 to-amber-800 bg-clip-text text-transparent">
                  = {formatCurrency(totalFinalSalary)}
                </span>
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
