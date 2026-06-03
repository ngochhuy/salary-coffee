# Phase 6: Polish and Error Handling

## Overview
Refine user experience with loading states, error handling, responsive design, and edge case handling.

---

## 6.1 Loading States

### Skeleton Loader for Schedule Table

Create `components/ui/skeleton.tsx` (via shadcn/ui):
```bash
npx shadcn@latest add skeleton
```

Update `ScheduleTable` to show skeleton during import:

```typescript
// In components/schedule-table.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduleTableProps {
  schedule?: ParsedSchedule | null;
  loading?: boolean;
}

export function ScheduleTable({ schedule, loading }: ScheduleTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) return null;

  // ... existing table render
}
```

### Button Loading State

Ensure all buttons show loading state:

```typescript
<Button disabled={loading}>
  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Import'}
</Button>
```

Add Loader2 icon from lucide-react (already installed with shadcn/ui).

---

## 6.2 Error Handling

### Error Types and Messages

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Invalid URL format | "Invalid Google Sheets URL. Please check the format." | Retry |
| Private sheet | "This sheet is private. Make it public: File > Share > Anyone with the link" | Fix permissions |
| Empty sheet | "The sheet appears to be empty or has no data." | Check sheet |
| Parse error | "Could not read the schedule. Check the sheet format." | Validate structure |
| Network error | "Could not connect. Check your internet connection." | Retry |
| Unknown error | "Something went wrong. Please try again." | Retry |

### Error Toast Notifications

Add sonner for toast notifications:
```bash
npm install sonner
```

Update `app/layout.tsx`:
```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

Update `SheetImport` to use toast:
```typescript
import { toast } from 'sonner';

const handleImport = async () => {
  try {
    const result = await importSheet(url);
    if (result.success) {
      toast.success('Schedule imported successfully!');
      onImport(result.data!);
    } else {
      toast.error(result.error || 'Failed to import');
    }
  } catch (err) {
    toast.error('An unexpected error occurred');
  }
};
```

---

## 6.3 Responsive Design

### Mobile-Friendly Table

Add horizontal scroll for tables on mobile:

```css
/* In globals.css or as utility */
.table-container {
  @apply overflow-x-auto scrollbar-thin;
}
```

Update `ScheduleTable`:
```tsx
<div className="table-container rounded-md border">
  <Table>...</Table>
</div>
```

### Responsive Grid for Wage/Summary

Already using `grid lg:grid-cols-2` which:
- Stacks vertically on mobile (< 1024px)
- Shows side-by-side on desktop (>= 1024px)

### Mobile-Specific Adjustments

```css
/* Add to globals.css */
@layer utilities {
  @media (max-width: 640px) {
    .text-mobile-sm {
      font-size: 0.875rem;
    }
  }
}
```

---

## 6.4 Edge Cases

### Empty Cell Handling
- Already handled: Shows "—" for empty cells
- No calculation performed for empty cells

### Employee Name Variations
- MVP: Exact match only
- Future: Add fuzzy matching for typos

### Multiple Employees in One Cell
Not supported in MVP. If cell contains "A, B", parser will treat as single name "A, B".

### Sheet Structure Variations
- MVP expects: Positions in column A, Days in row 1
- Error if: Transposed structure
- Future: Auto-detect orientation

### Special Characters in Names
- CSV parser handles UTF-8
- Vietnamese names supported
- Special characters (đ, à, ả, ã...) work correctly

### Large Schedules
- Edge runtime has 50MB response limit
- Most schedules < 1MB
- If larger, consider pagination

### Browser Compatibility
- localStorage required
- Falls back gracefully if disabled (no persistence)
- Modern browsers only (ES2020+)

---

## 6.5 Accessibility

### Keyboard Navigation
- All inputs have associated labels
- Enter key submits form
- Tab navigation works correctly

### Screen Reader Support
- Tables have proper headers
- ARIA labels on inputs
- Error messages announced

### Color Contrast
- shadcn/ui handles by default
- Badge variants have sufficient contrast

### Focus States
- All interactive elements have visible focus
- Tailwind `ring` utilities applied

---

## 6.6 Performance Optimizations

### Memoization
- Already using `useMemo` for expensive operations
- Employee extraction memoized
- No unnecessary re-renders

### localStorage Debouncing
- Wages saved immediately on change (simple)
- Could add debouncing if performance issues

### API Caching
- Edge runtime caches at CDN level
- Could add Cache-Control headers if needed

### Code Splitting
- Next.js App Router splits automatically
- Components loaded as needed

---

## 6.7 Print Styles

Add print-friendly CSS:
```css
/* In globals.css */
@media print {
  body {
    @apply bg-white text-black;
  }

  .no-print {
    display: none !important;
  }

  .print-break-after {
    page-break-after: always;
  }

  @page {
    margin: 1cm;
  }
}
```

Update `SalarySummary` button:
```tsx
<Button className="no-print" onClick={exportToCSV}>
  Export CSV
</Button>
```

Add print button:
```tsx
<Button onClick={() => window.print()}>
  Print
</Button>
```

---

## 6.8 Dark Mode Support

shadcn/ui already supports dark mode. Add theme toggle if desired:

**Create `components/theme-toggle.tsx`:**
```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDark(theme === 'dark');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <button onClick={toggle} className="p-2 rounded-md hover:bg-accent">
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
```

---

## Verification Checklist

### Loading States
- [ ] Import button shows loading spinner
- [ ] Schedule table shows skeleton during import
- [ ] Button disabled during loading

### Error Handling
- [ ] Invalid URL shows error message
- [ ] Private sheet shows helpful instructions
- [ ] Network errors handled gracefully
- [ ] Toast notifications appear correctly

### Responsive Design
- [ ] Table scrolls horizontally on mobile
- [ ] Wage/Summary stack on mobile
- [ ] No horizontal scroll on body
- [ ] Text sizes appropriate on mobile

### Edge Cases
- [ ] Empty cells display correctly
- [ ] Vietnamese names parse correctly
- [ ] Special characters work
- [ ] Large schedules handled

### Accessibility
- [ ] All inputs have labels
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Colors have sufficient contrast

### Performance
- [ ] No console errors
- [ ] Fast initial load
- [ ] Smooth re-renders
- [ ] localStorage operations fast

### Print
- [ ] Print view is clean
- [ ] No buttons in print
- [ ] Tables fit on page

---

## Dependencies

**Depends on:** Phase 5 (Main Page Integration)

**Required for:** None (final phase)

---

## Estimated Time

**Total: 1 hour**
- Loading states: 15 min
- Error handling: 20 min
- Responsive design: 10 min
- Accessibility checks: 10 min
- Print styles: 5 min

---

## Unresolved Questions

1. **Multi-sheet support**: Should we support selecting which sheet in a workbook? → Post-MVP
2. **Employee name normalization**: How to handle "Nguyễn Văn A" vs "A Nguyễn"? → Post-MVP
3. **Overtime rates**: Should we add overtime calculation? → Post-MVP
4. **Export to PDF**: Should we add PDF export? → Post-MVP
