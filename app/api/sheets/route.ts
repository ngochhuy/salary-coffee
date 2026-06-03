import { NextRequest, NextResponse } from 'next/server';
import { extractSheetId, parseCSV } from '@/lib/sheets-parser';
import { ParsedSchedule, ShiftData } from '@/types';

export const runtime = 'edge';

/**
 * Parse workbook HTML to extract all sheet GIDs
 */
function extractSheetGIDs(html: string): string[] {
  const gids: string[] = [];

  // Match sheet links in the HTML
  // Pattern: gid=12345 or "gid","12345"
  const gidRegex = /gid[=:](\d+)/g;
  let match;

  while ((match = gidRegex.exec(html)) !== null) {
    const gid = match[1];
    if (!gids.includes(gid)) {
      gids.push(gid);
    }
  }

  return gids;
}

/**
 * Fetch CSV from a specific sheet GID
 */
async function fetchSheetCSV(sheetId: string, gid: string): Promise<string> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${gid}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Combine multiple parsed schedules into one
 */
function combineSchedules(schedules: ParsedSchedule[]): ParsedSchedule {
  if (schedules.length === 0) {
    return { positions: [], days: [], cells: [[]] };
  }

  if (schedules.length === 1) {
    return schedules[0];
  }

  const combined: ParsedSchedule = {
    positions: [],
    days: [],
    cells: [],
  };

  const allUniqueDates = new Set<string>(); // Unique dates (without 3x repetition)
  const allPositions = new Set<string>();

  // Extract unique dates from schedules (each date appears 3 times in source data)
  for (const schedule of schedules) {
    schedule.positions.forEach((p) => allPositions.add(p));

    // Extract unique dates from the days array (which has 3x repetition)
    // Each date like "1/1" appears 3 times consecutively
    const seenDates = new Set<string>();
    for (let i = 0; i < schedule.days.length; i++) {
      const date = schedule.days[i];
      if (!seenDates.has(date)) {
        seenDates.add(date);
        allUniqueDates.add(date);
      }
    }
  }

  combined.positions = Array.from(allPositions).sort();

  // Create days array with each date repeated 3 times (for Ca1, Ca2, Ca3)
  const SHIFTS_PER_DAY = 3;
  const sortedDates = Array.from(allUniqueDates).sort();
  const repeatedDays: string[] = [];
  for (const date of sortedDates) {
    for (let shift = 0; shift < SHIFTS_PER_DAY; shift++) {
      repeatedDays.push(date);
    }
  }
  combined.days = repeatedDays;

  // Create a map to track cells by position, date, and columnOffset
  // Key format: "position|date|columnOffset" where columnOffset is 0=Ca1, 1=Ca2, 2=Ca3
  const cellMap = new Map<string, ShiftData>();

  for (const schedule of schedules) {
    for (let rowIdx = 0; rowIdx < schedule.positions.length; rowIdx++) {
      const position = schedule.positions[rowIdx];

      for (let colIdx = 0; colIdx < schedule.days.length; colIdx++) {
        const cell = schedule.cells[rowIdx]?.[colIdx];

        if (cell && cell.employee) {
          // Create key with position, date, and columnOffset
          // columnOffset should already be 0, 1, or 2 from the parser
          const key = `${position}|${cell.date}|${cell.columnOffset}`;

          // Only add if not already present (first schedule takes priority)
          if (!cellMap.has(key)) {
            cellMap.set(key, cell);
          }
        }
      }
    }
  }

  // Build combined cells array
  // The combined.days array has each date repeated 3 times
  // For a date like "15/4", the array has: ["15/4", "15/4", "15/4"]
  // with columnOffsets: 0, 1, 2 respectively
  for (const position of combined.positions) {
    const row: ShiftData[] = [];

    for (let colIdx = 0; colIdx < combined.days.length; colIdx++) {
      const date = combined.days[colIdx];
      const columnOffset = colIdx % SHIFTS_PER_DAY; // 0=Ca1, 1=Ca2, 2=Ca3

      const key = `${position}|${date}|${columnOffset}`;
      const cell = cellMap.get(key);

      if (cell) {
        row.push(cell);
      } else {
        // Empty cell
        row.push({
          employee: '',
          shiftType: null,
          date,
          columnOffset,
        });
      }
    }

    combined.cells.push(row);
  }

  return combined;
}

/**
 * POST /api/sheets
 * Fetch schedule data from Google Sheets (all tabs)
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const sheetId = extractSheetId(url);

    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Sheets URL' },
        { status: 400 }
      );
    }

    // First, fetch the workbook HTML to find all sheet GIDs
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`;
    const htmlResponse = await fetch(htmlUrl);

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Sheet not found or not accessible' },
        { status: 403 }
      );
    }

    const html = await htmlResponse.text();
    const gids = extractSheetGIDs(html);

    if (gids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No sheets found in workbook' },
        { status: 404 }
      );
    }

    // Fetch CSV from each sheet
    const schedules: ParsedSchedule[] = [];
    const errors: string[] = [];

    for (const gid of gids) {
      try {
        const csvText = await fetchSheetCSV(sheetId, gid);
        const schedule = parseCSV(csvText);

        // Only add if schedule has data
        if (schedule.positions.length > 0 && schedule.days.length > 0) {
          schedules.push(schedule);
        }
      } catch (error) {
        const errorMsg = `Failed to fetch sheet ${gid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    if (schedules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid schedule data found in any sheet' },
        { status: 404 }
      );
    }

    // Combine all schedules
    const combinedSchedule = combineSchedules(schedules);

    return NextResponse.json({
      success: true,
      data: {
        sheets: schedules,
        combinedSchedule,
        sheetCount: schedules.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
