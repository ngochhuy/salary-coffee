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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const min = Math.round((hours - h) * 60);
  return min > 0 ? `${h}h ${min}p` : `${h}h`;
}

const SHIFT_TYPE_LABELS: Record<string, string> = {
  'M-14h': 'Ca Sáng (6:30-14:00)',
  'M': 'Ca Sáng (6:30-15:00)',
  'N': 'Ca Chiều (14:00-22:00)',
  'ca3': 'Ca 3 (18:00-22:00)',
  'custom': 'Tùy chỉnh',
  'unknown': 'Không xác định',
};

/**
 * Parse date string "D/M" or "D/M/YYYY" to sortable value
 * Returns { year, month, day } for comparison
 */
function parseDateValue(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.trim().split('/');
  const day = parseInt(parts[0], 10) || 1;
  const month = parseInt(parts[1], 10) || 1;
  const year = parseInt(parts[2], 10) || new Date().getFullYear();
  return { year, month, day };
}

/**
 * Compare two date strings for sorting
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
function compareDates(a: string, b: string): number {
  const dateA = parseDateValue(a);
  const dateB = parseDateValue(b);

  if (dateA.year !== dateB.year) return dateA.year - dateB.year;
  if (dateA.month !== dateB.month) return dateA.month - dateB.month;
  return dateA.day - dateB.day;
}

export function EmployeeDetailDialog({
  employee,
  open,
  onOpenChange,
  monthLabel,
}: EmployeeDetailDialogProps) {
  if (!employee) return null;

  // Sort shifts by date (ascending)
  const sortedShifts = [...employee.shifts].sort((a, b) => compareDates(a.date, b.date));

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
                <div className="text-xs text-muted-foreground">Ca &gt; 7h</div>
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
              <div className="rounded-md border overflow-x-auto scrollbar-thin">
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
                    {sortedShifts.map((shift, idx) => (
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
                          {formatCurrency((shift.hours * employee.hourlyWage) + shift.allowance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
