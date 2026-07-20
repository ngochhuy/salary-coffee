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
import { User, Clock, Wallet, Coffee, TrendingUp } from 'lucide-react';

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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
              <User className="h-6 w-6 text-amber-800" />
            </div>
            <div>
              <DialogTitle className="text-2xl text-amber-900 font-heading">{employee.employeeName}</DialogTitle>
              <DialogDescription className="text-amber-700/70">
                Chi tiết lương tháng {monthLabel || 'hiện tại'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-amber-700/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Tổng giờ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{formatHours(employee.totalHours)}</div>
                <div className="text-xs text-amber-700/70">{employee.daysWorked} ngày làm</div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-amber-700/80 flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  Lương cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-800">{formatCurrency(employee.totalSalary)}</div>
                <div className="text-xs text-amber-700/70">{formatCurrency(employee.hourlyWage)}/giờ</div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-amber-700/80 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Trợ cấp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(employee.totalAllowance)}</div>
                <div className="text-xs text-amber-700/70">Ca &gt; 7h</div>
              </CardContent>
            </Card>

            <Card className="border-amber-700/30 bg-gradient-to-br from-amber-700 to-amber-800 shadow-coffee">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-amber-100 flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  Tổng nhận
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(employee.finalSalary)}</div>
                <div className="text-xs text-amber-200">Cơ bản + Trợ cấp</div>
              </CardContent>
            </Card>
          </div>

          {/* Shift Breakdown */}
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee">
            <CardHeader className="pb-4">
              <CardTitle className="text-amber-900 font-heading text-lg">Thống kê ca làm việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <div className="text-2xl font-bold text-amber-900">{employee.shiftBreakdown['M-14h']}</div>
                  <div className="text-xs text-amber-700/70 mt-1">Ca M - 14h</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <div className="text-2xl font-bold text-amber-900">{employee.shiftBreakdown['M']}</div>
                  <div className="text-xs text-amber-700/70 mt-1">Ca M</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-center">
                  <div className="text-2xl font-bold text-orange-900">{employee.shiftBreakdown['N']}</div>
                  <div className="text-xs text-orange-700/70 mt-1">Ca N</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <div className="text-2xl font-bold text-amber-900">{employee.shiftBreakdown['ca3']}</div>
                  <div className="text-xs text-amber-700/70 mt-1">Ca 3</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <div className="text-2xl font-bold text-amber-900">{employee.shiftBreakdown['custom']}</div>
                  <div className="text-xs text-amber-700/70 mt-1">Tùy chỉnh</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shift Details Table */}
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee">
            <CardHeader className="pb-4">
              <CardTitle className="text-amber-900 font-heading text-lg">Chi tiết từng ca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-amber-200 overflow-hidden bg-white/50">
                <Table>
                  <TableHeader className="bg-amber-50/50">
                    <TableRow className="hover:bg-amber-50/50 border-amber-200">
                      <TableHead className="text-amber-900 font-semibold">Ngày</TableHead>
                      <TableHead className="text-amber-900 font-semibold">Loại ca</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Số giờ</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Trợ cấp</TableHead>
                      <TableHead className="text-right text-amber-900 font-semibold">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedShifts.map((shift, idx) => (
                      <TableRow key={idx} className="hover:bg-amber-50/50 border-amber-100">
                        <TableCell className="font-medium text-amber-900">{shift.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                            {SHIFT_TYPE_LABELS[shift.shiftType] || shift.shiftType}
                          </Badge>
                          {shift.shiftType === 'custom' && shift.timeLabel && (
                            <span className="text-xs text-amber-700/80 ml-2 font-medium">
                              ({shift.timeLabel})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-amber-800">{formatHours(shift.hours)}</TableCell>
                        <TableCell className="text-right">
                          {shift.allowance > 0 ? (
                            <span className="text-green-700 font-medium">+{formatCurrency(shift.allowance)}</span>
                          ) : (
                            <span className="text-amber-700/50">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-900">
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
