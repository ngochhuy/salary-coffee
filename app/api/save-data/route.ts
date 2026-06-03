import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

/**
 * POST /api/save-data
 * Save schedule data to public/data/ for debugging (DEV ONLY)
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();

    // Create public/data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'public', 'data');
    await mkdir(dataDir, { recursive: true });

    // Save to public/data/schedule.json
    const filePath = join(dataDir, 'schedule.json');
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Schedule data saved to:', filePath);

    return NextResponse.json({
      success: true,
      path: '/data/schedule.json',
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
