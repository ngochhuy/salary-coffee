# Phase 3: API Endpoint

## Overview
Create Next.js API route to fetch and parse Google Sheets data.

---

## 3.1 Sheets API Route (`app/api/sheets/route.ts`)

### Implementation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, extractSheetId } from '@/lib/sheets-parser';
import { SheetImportResult } from '@/types';

export const runtime = 'edge'; // Use Edge runtime for faster cold starts
export const dynamic = 'force-dynamic'; // Disable caching for fresh data

/**
 * POST /api/sheets
 * Fetches and parses a Google Sheets schedule
 *
 * Body: { url: string }
 * Returns: SheetImportResult
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract sheet ID from URL
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Sheets URL format' },
        { status: 400 }
      );
    }

    // Build CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    // Fetch CSV data
    const csvResponse = await fetch(csvUrl, {
      // cache: 'no-store', // Force fresh fetch
      headers: {
        'User-Agent': 'Salary-Calculator/1.0',
      },
    });

    if (!csvResponse.ok) {
      if (csvResponse.status === 403 || csvResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot access this sheet. Make sure it is publicly accessible (File > Share > Anyone with the link).'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to fetch sheet: ${csvResponse.statusText}` },
        { status: 500 }
      );
    }

    // Get CSV text
    const csvText = await csvResponse.text();

    // Validate CSV content
    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sheet is empty or could not be parsed' },
        { status: 400 }
      );
    }

    // Parse CSV
    const schedule = parseCSV(csvText);

    // Validate parsed data
    if (schedule.positions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No positions found in sheet. Check sheet structure.' },
        { status: 400 }
      );
    }

    const result: SheetImportResult = {
      success: true,
      data: schedule,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Sheets API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
```

---

## 3.2 Error Handling Strategy

### Error Types

| Error | HTTP Status | User Message |
|-------|-------------|--------------|
| Missing URL | 400 | "URL is required" |
| Invalid URL format | 400 | "Invalid Google Sheets URL format" |
| Private sheet (403) | 400 | "Make sure sheet is publicly accessible" |
| Sheet not found (404) | 400 | "Sheet not found or deleted" |
| Network timeout | 500 | "Failed to fetch sheet. Try again." |
| Empty CSV | 400 | "Sheet is empty" |
| Invalid structure | 400 | "No positions found. Check sheet structure." |
| Unknown error | 500 | "Unknown error occurred" |

### Response Format

**Success:**
```json
{
  "success": true,
  "data": {
    "positions": ["Barista", "Cashier"],
    "days": ["Thứ 2", "Thứ 3"],
    "cells": [...]
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## 3.3 Client-Side Fetching Helper

Create a helper function for components to call the API:

**`lib/api.ts`** (new file):

```typescript
import { SheetImportResult } from '@/types';

export async function importSheet(url: string): Promise<SheetImportResult> {
  const response = await fetch('/api/sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.error || 'Request failed' };
  }

  return response.json();
}
```

---

## 3.4 Testing the API

### Manual Testing

**Test with curl:**
```bash
curl -X POST http://localhost:3000/api/sheets \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"}'
```

**Test with browser console:**
```javascript
fetch('/api/sheets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'YOUR_SHEET_URL' })
}).then(r => r.json()).then(console.log);
```

### Test Cases

- [ ] Valid public sheet URL returns parsed data
- [ ] Invalid URL format returns 400 error
- [ ] Private sheet returns helpful error message
- [ ] Empty sheet returns error
- [ ] Network timeout handled gracefully
- [ ] CSV with special characters parsed correctly
- [ ] Sheet with multiple rows/columns parsed correctly

---

## 3.5 Edge Runtime Benefits

Using `export const runtime = 'edge'`:
- Faster cold starts (~50ms vs ~500ms for Node)
- Automatic scaling
- Lower cost at scale
- Built-in caching via Vercel Edge Network

**Trade-off:**
- No Node.js APIs (not needed for this use case)
- 50MB response limit (not an issue for schedules)

---

## Verification Checklist

- [ ] API route file created at `app/api/sheets/route.ts`
- [ ] Helper function created at `lib/api.ts`
- [ ] TypeScript compiles without errors
- [ ] Manual curl test succeeds
- [ ] Error cases return proper HTTP status codes
- [ ] Success case returns parsed schedule data

---

## Dependencies

**Depends on:** Phase 2 (Core Logic - sheets-parser, types)

**Required for:** Phase 4 (UI Components - SheetImport)

---

## Estimated Time

**Total: 2 hours**
- API route implementation: 1h
- Error handling: 30 min
- Testing helper: 15 min
- Manual testing: 15 min
