'use client';

import { ParsedSchedule, ShiftData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface ScheduleTableProps {
  schedule: ParsedSchedule;
}

function ShiftCell({ shift }: { shift: ShiftData }) {
  if (!shift.employee) {
    return <span className="text-amber-700/40">—</span>;
  }

  const getShiftVariant = (type: string | null) => {
    switch (type) {
      case 'M-14h':
      case 'M':
        return 'default';
      case 'N':
        return 'secondary';
      case 'ca3':
        return 'outline';
      case 'custom':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getShiftLabel = (shift: ShiftData) => {
    if (shift.shiftType === 'custom' && shift.customHours) {
      return `${shift.customHours.start}h-${shift.customHours.end}h`;
    }
    return shift.shiftType || '?';
  };

  return (
    <div className="space-y-1">
      <div className="font-medium text-sm text-amber-900">{shift.employee}</div>
      {shift.shiftType && (
        <Badge
          variant={getShiftVariant(shift.shiftType)}
          className={`text-xs ${
            getShiftVariant(shift.shiftType) === 'default'
              ? 'bg-amber-700 text-white border-amber-800'
              : getShiftVariant(shift.shiftType) === 'secondary'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : 'border-amber-200 text-amber-800 bg-amber-50'
          }`}
        >
          {getShiftLabel(shift)}
        </Badge>
      )}
    </div>
  );
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  return (
    <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-coffee">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-amber-700" />
          </div>
          <CardTitle className="text-amber-900 font-heading">Lịch Làm Việc</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-amber-200 overflow-hidden bg-white/50">
          <Table>
            <TableHeader className="bg-amber-50/50">
              <TableRow className="hover:bg-amber-50/50 border-amber-200">
                <TableHead className="w-[120px] min-w-[120px] text-amber-900 font-semibold">Vị Trí</TableHead>
                {schedule.days.map((day, idx) => {
                  const shiftLabel = idx % 3 === 0 ? 'Ca1' : idx % 3 === 1 ? 'Ca2' : 'Ca3';
                  return (
                    <TableHead key={`${day}-${idx}`} className="min-w-[100px] whitespace-nowrap text-center">
                      <div className="text-xs text-amber-700/70">{shiftLabel}</div>
                      <div className="text-amber-900">{day}</div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.positions.map((position, rowIdx) => (
                <TableRow key={position} className="hover:bg-amber-50/50 border-amber-100">
                  <TableCell className="font-medium whitespace-nowrap text-amber-900">{position}</TableCell>
                  {schedule.cells[rowIdx]?.map((cell, colIdx) => (
                    <TableCell key={`${rowIdx}-${colIdx}`} className="min-w-[100px]">
                      <ShiftCell shift={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
