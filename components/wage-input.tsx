'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeWage } from '@/types';
import { updateWage, getWages } from '@/lib/storage';
import { Wallet } from 'lucide-react';

interface WageInputProps {
  employees: string[];
  onWagesChange?: (wages: EmployeeWage[]) => void;
}

export function WageInput({ employees, onWagesChange }: WageInputProps) {
  const [wages, setWages] = useState<Record<string, number>>({});

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wages, employees]); // Remove onWagesChange to prevent loop

  const handleWageChange = (employee: string, value: string) => {
    const wageValue = parseFloat(value) || 0;
    setWages((prev) => ({ ...prev, [employee]: wageValue }));

    // Save to localStorage immediately
    updateWage(employee, wageValue);
  };

  if (employees.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-amber-700" />
          </div>
          <CardTitle className="text-amber-900 font-heading">Lương Theo Giờ</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee, index) => (
            <div
              key={employee}
              className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-800 font-semibold text-sm flex-shrink-0">
                {employee.charAt(0).toUpperCase()}
              </div>
              <Label
                htmlFor={`wage-${employee}`}
                className="flex-1 min-w-[100px] sm:w-auto font-medium text-amber-900 cursor-pointer"
              >
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
                className="w-28 sm:w-32 border-amber-200 bg-white focus:border-amber-400 focus:ring-amber-400 text-amber-900 font-medium"
              />
              <span className="text-sm text-amber-700/80 whitespace-nowrap font-medium">VNĐ/h</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
