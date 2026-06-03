'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleTable } from '@/components/schedule-table';
import { WageInput } from '@/components/wage-input';
import { MonthSelector } from '@/components/month-selector';
import { MonthlySalarySummary } from '@/components/monthly-salary-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Download } from 'lucide-react';
import {
  ParsedSchedule,
  EmployeeWage,
  MonthlySalaryCalculation,
} from '@/types';
import { calculateMonthlySalaries, extractEmployees } from '@/lib/salary-calculator';
import { getWages, loadScheduleFromDebugFile } from '@/lib/storage';

// Sheet URL from .env (no user input needed)
const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || '';

export default function HomePage() {
  // State
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null);
  const [wages, setWages] = useState<EmployeeWage[]>([]);
  const [monthlyCalculations, setMonthlyCalculations] = useState<MonthlySalaryCalculation[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null); // Store raw API response for debugging

  // Save data to file for debugging (dev only)
  const saveDebugData = useCallback(async (data: any) => {
    if (!data) {
      console.warn('⚠️ No data to save');
      return;
    }

    try {
      const response = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Data saved to', result.path);
      } else {
        console.warn('⚠️ Failed to save:', result.error);
      }
    } catch (err) {
      console.warn('⚠️ Save error:', err);
    }
  }, []);

  // Fetch schedule from Google Sheets
  const handleFetchSchedule = useCallback(async () => {
    if (!SHEET_URL) {
      setError('Chưa cấu hình NEXT_PUBLIC_SHEET_URL trong .env.local');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: SHEET_URL }),
      });

      const result = await response.json();

      if (result.success && result.data?.combinedSchedule) {
        setSchedule(result.data.combinedSchedule);
        setRawData(result.data); // Store for debug save

        console.log('✅ Schedule loaded:', {
          sheets: result.data.sheetCount,
          positions: result.data.combinedSchedule.positions.length,
          days: result.data.combinedSchedule.days.length,
        });

        // Auto-save to file in dev mode
        if (process.env.NODE_ENV === 'development') {
          await saveDebugData(result.data);
        }
      } else {
        setError(result.error || 'Lỗi khi fetch dữ liệu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load saved data and fetch schedule on mount
  useEffect(() => {
    const loadData = async () => {
      // Load wages from localStorage (user input - should persist)
      const savedWages = getWages();
      setWages(savedWages);

      // DEV MODE: Try loading from debug file first
      if (process.env.NODE_ENV === 'development') {
        const debugData = await loadScheduleFromDebugFile();
        if (debugData) {
          setSchedule(debugData);
          console.log('✅ Loaded from debug file');
          return;
        }
      }

      // Fall back to API fetch
      if (SHEET_URL) {
        handleFetchSchedule();
      }
    };

    loadData();
  }, []);

  // Extract employees from schedule - memoized to prevent infinite loop
  const employees = useMemo(() => extractEmployees(schedule), [schedule]);

  // Recalculate monthly salaries when schedule or wages change
  useEffect(() => {
    if (schedule && wages.length > 0) {
      const results = calculateMonthlySalaries(schedule, wages);
      setMonthlyCalculations(results);
    } else {
      setMonthlyCalculations([]);
    }
  }, [schedule, wages]);

  // Handle wage changes - memoized to prevent infinite loop
  const handleWageChange = useCallback((updatedWages: EmployeeWage[]) => {
    setWages(updatedWages);
  }, []);

  // Manual save button handler (uses saved rawData)
  const handleManualSave = useCallback(() => {
    if (rawData) {
      saveDebugData(rawData);
    }
  }, [rawData]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Header with Refresh Button */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Tính Lương Nhân Viên
            </h1>
          </div>
          <div className="flex gap-2">
            {/* Debug button - only in dev mode */}
            {process.env.NODE_ENV === 'development' && rawData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Save Debug
              </Button>
            )}
            <Button onClick={handleFetchSchedule} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Đang cập nhật...' : 'Cập nhật lịch'}
            </Button>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content - Show After Schedule Loaded */}
        {schedule && (
          <div className="space-y-8">
            {/* Month Selector */}
            <MonthSelector
              monthlyData={monthlyCalculations}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Wage Input */}
              <WageInput
                employees={employees}
                onWagesChange={handleWageChange}
              />

              {/* Monthly Salary Summary */}
              <div className="lg:col-span-1">
                <MonthlySalarySummary
                  monthlyData={monthlyCalculations}
                  selectedMonth={selectedMonth}
                />
              </div>
            </div>

            {/* Optional: Schedule Table (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground select-none">
                Xem lịch chi tiết ▼
              </summary>
              <ScheduleTable schedule={schedule} />
            </details>
          </div>
        )}

        {/* Empty State */}
        {!schedule && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {!SHEET_URL ? 'Chưa cấu hình URL Google Sheets' : 'Đang tải dữ liệu...'}
                </p>
                {!SHEET_URL && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Vui lòng tạo file .env.local với NEXT_PUBLIC_SHEET_URL
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
