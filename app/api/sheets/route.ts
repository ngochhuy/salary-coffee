import { NextRequest, NextResponse } from 'next/server';
import { extractSheetId, parseCSV, combineSchedules } from '@/lib/sheets-parser';
import { ParsedSchedule, ShiftData } from '@/types';

export const runtime = 'edge';
export const revalidate = 604800; // Cache 1 tuần (7 ngày * 24h * 3600s = 604,800 giây)


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
  const response = await fetch(csvUrl, { next: { revalidate: 604800 } });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${gid}: ${response.statusText}`);
  }

  return await response.text();
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
    const htmlResponse = await fetch(htmlUrl, { next: { revalidate: 604800 } });

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
