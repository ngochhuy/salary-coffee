'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleTable } from '@/components/schedule-table';
import { WageInput } from '@/components/wage-input';
import { WageInputDialog } from '@/components/wage-input-dialog';
import { MonthSelector } from '@/components/month-selector';
import { MonthlySalarySummary } from '@/components/monthly-salary-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Download, Wallet } from 'lucide-react';
import {
  ParsedSchedule,
  EmployeeWage,
  MonthlySalaryCalculation,
} from '@/types';
import { calculateMonthlySalaries, extractEmployees } from '@/lib/salary-calculator';
import { getWages, loadScheduleFromDebugFile, getCachedSchedule, setCachedSchedule } from '@/lib/storage';
import { SHEET_URLS } from '@/lib/sheets-config';
import { combineSchedules, extractSheetId } from '@/lib/sheets-parser';

export default function HomePage() {
  // State
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null);
  const [wages, setWages] = useState<EmployeeWage[]>([]);
  const [monthlyCalculations, setMonthlyCalculations] = useState<MonthlySalaryCalculation[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null); // Store raw API response for debugging
  const [wageDialogOpen, setWageDialogOpen] = useState(false); // Wage dialog state

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

  // Load and combine Google Sheet schedules (from cache or API fetch)
  const loadAndCombineSchedules = useCallback(async (forceRefresh = false) => {
    if (SHEET_URLS.length === 0) {
      setError('Chưa cấu hình Google Sheets trong .env.local');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchPromises = SHEET_URLS.map(async (url) => {
        const sheetId = extractSheetId(url) || 'default';

        // Check debug file in development mode
        if (process.env.NODE_ENV === 'development' && !forceRefresh) {
          const debugData = await loadScheduleFromDebugFile(sheetId);
          if (debugData) {
            return debugData;
          }
        }

        // Check local storage cache
        if (!forceRefresh) {
          const cached = getCachedSchedule(sheetId);
          if (cached) {
            return cached;
          }
        }

        // Fetch via sheets API
        const response = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const result = await response.json();
        if (result.success && result.data?.combinedSchedule) {
          // Update cache
          setCachedSchedule(result.data.combinedSchedule, sheetId);
          return result.data.combinedSchedule;
        } else {
          throw new Error(result.error || `Lỗi khi tải bảng tính`);
        }
      });

      const schedules = await Promise.all(fetchPromises);
      const combined = combineSchedules(schedules);
      
      setSchedule(combined);
      setRawData(combined); // Store combined schedule for manual save

      console.log(`✅ Loaded and combined ${schedules.length} sheets successfully:`, {
        positions: combined.positions.length,
        days: combined.days.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi gộp lịch');
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

      // Tải và gộp lịch
      await loadAndCombineSchedules(false);
    };

    loadData();
  }, [loadAndCombineSchedules]);

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
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 md:p-8 max-w-7xl space-y-8">
        {/* Header with Coffee Theme */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img
                src="/logo-original.jpg"
                alt="Logo Coffee"
                className="w-10 h-10 object-cover shadow-coffee"
              />
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gradient-coffee">
                Tính Lương
              </h1>
            </div>
            <p className="text-sm text-amber-800/70 font-body pl-12">
              Quản lý lương nhân viên Passport
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Nút Cập nhật bảng lương */}
            <Button
              onClick={() => setWageDialogOpen(true)}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-coffee press-effect"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Cập nhật bảng lương
            </Button>
            {/* Debug button - only in dev mode */}
            {process.env.NODE_ENV === 'development' && rawData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                className="text-xs border-amber-200 hover:bg-amber-50"
              >
                <Download className="h-3 w-3 mr-1" />
                Save Debug
              </Button>
            )}
            <Button
              onClick={() => loadAndCombineSchedules(true)}
              disabled={loading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-coffee press-effect"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Đang cập nhật...' : 'Cập nhật lịch'}
            </Button>
          </div>
        </header>

        {/* Error Display with Coffee Theme */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content - Show After Schedule Loaded */}
        {schedule && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Month Selector */}
            <MonthSelector
              monthlyData={monthlyCalculations}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />

            {/* Monthly Salary Summary - Full Width */}
            <MonthlySalarySummary
              monthlyData={monthlyCalculations}
              selectedMonth={selectedMonth}
            />

            {/* Optional: Schedule Table (collapsible) */}
            <details className="group bg-white/60 backdrop-blur-sm rounded-2xl border border-amber-100 overflow-hidden hover-lift">
              <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-amber-800 hover:text-amber-900 hover:bg-amber-50/50 transition-colors select-none flex items-center justify-between">
                <span>Xem lịch chi tiết</span>
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6">
                <ScheduleTable schedule={schedule} />
              </div>
            </details>
          </div>
        )}

        {/* Empty State with Coffee Theme */}
        {!schedule && !loading && (
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee">
            <CardContent className="pt-6">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-4xl">☕</span>
                </div>
                <h3 className="text-xl font-heading font-semibold text-amber-900 mb-2">
                  {SHEET_URLS.length === 0 ? 'Chưa cấu hình Google Sheets' : 'Đang tải dữ liệu...'}
                </h3>
                <p className="text-amber-700/70 mb-6">
                  {SHEET_URLS.length === 0
                    ? 'Vui lòng cấu hình URL Google Sheets trong .env.local để bắt đầu tính lương'
                    : 'Vui lòng đợi trong giây lát...'}
                </p>
                {SHEET_URLS.length === 0 && (
                  <div className="inline-block px-4 py-2 bg-amber-100 rounded-lg text-sm text-amber-800">
                    <code className="text-xs">NEXT_PUBLIC_SHEET_URL=your_sheet_url</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wage Input Dialog */}
      <WageInputDialog
        employees={employees}
        open={wageDialogOpen}
        onOpenChange={setWageDialogOpen}
        onWagesChange={handleWageChange}
      />
    </main>
  );
}
