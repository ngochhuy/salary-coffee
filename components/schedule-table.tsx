'use client';

import { ParsedSchedule, ShiftData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ScheduleTableProps {
  schedule: ParsedSchedule;
}

function ShiftCell({ shift }: { shift: ShiftData }) {
  if (!shift.employee) {
    return <span className="text-muted-foreground">—</span>;
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
      <div className="font-medium text-sm">{shift.employee}</div>
      {shift.shiftType && (
        <Badge variant={getShiftVariant(shift.shiftType)} className="text-xs">
          {getShiftLabel(shift)}
        </Badge>
      )}
    </div>
  );
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch Làm Việc</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] min-w-[120px]">Vị Trí</TableHead>
                {schedule.days.map((day) => (
                  <TableHead key={day} className="min-w-[100px] whitespace-nowrap">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.positions.map((position, rowIdx) => (
                <TableRow key={position}>
                  <TableCell className="font-medium whitespace-nowrap">{position}</TableCell>
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
