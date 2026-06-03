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
    <Card>
      <CardHeader>
        <CardTitle>Lương Theo Giờ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee} className="flex items-center gap-4">
              <Label htmlFor={`wage-${employee}`} className="w-48 min-w-[120px] truncate">
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
              <span className="text-sm text-muted-foreground whitespace-nowrap">VNĐ/giờ</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
