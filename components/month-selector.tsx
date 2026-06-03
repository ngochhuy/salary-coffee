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
