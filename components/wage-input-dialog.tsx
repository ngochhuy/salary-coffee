'use client';

import { WageInput } from '@/components/wage-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface WageInputDialogProps {
  employees: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWagesChange?: (wages: any[]) => void;
}

export function WageInputDialog({
  employees,
  open,
  onOpenChange,
  onWagesChange,
}: WageInputDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-700 to-amber-800 flex items-center justify-center shadow-coffee">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-amber-900 font-heading">
                Cập Nhật Lương Theo Giờ
              </DialogTitle>
              <DialogDescription className="text-amber-700/70">
                Nhập mức lương theo giờ cho từng nhân viên
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <WageInput employees={employees} onWagesChange={onWagesChange} />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-coffee press-effect"
          >
            Hoàn tất
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
