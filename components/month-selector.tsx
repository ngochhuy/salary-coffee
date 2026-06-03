'use client';

import { MonthlySalaryCalculation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
    <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-700" />
            </div>
            <CardTitle className="text-amber-900 font-heading">Chọn Tháng</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="border-amber-200 hover:bg-amber-50 disabled:opacity-40 press-effect"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge className="px-4 py-2 text-base bg-gradient-to-r from-amber-700 to-amber-800 text-white border-0 shadow-sm">
              {getCurrentLabel()}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === months.length - 1}
              className="border-amber-200 hover:bg-amber-50 disabled:opacity-40 press-effect"
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
            className={
              selectedMonth === 'all'
                ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white border-0 press-effect'
                : 'border-amber-200 hover:bg-amber-50 text-amber-800 press-effect'
            }
          >
            Tất cả ({monthlyData.length} tháng)
          </Button>
          {monthlyData.map((month) => (
            <Button
              key={month.month}
              variant={selectedMonth === month.month ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMonthChange(month.month)}
              className={
                selectedMonth === month.month
                  ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white border-0 press-effect'
                  : 'border-amber-200 hover:bg-amber-50 text-amber-800 press-effect'
              }
            >
              {month.monthLabel}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
