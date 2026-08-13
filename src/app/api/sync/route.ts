import { NextResponse } from 'next/server';
import { syncPostgresToMysql } from '@/lib/sync';

// Security check to ensure only authorized requests can trigger the sync
const SYNC_SECRET = process.env.SYNC_SECRET;

export async function POST(request: Request) {
  try {
    // 1. Strict Security: Block if no secret is defined in environment variables
    if (!SYNC_SECRET) {
      console.error('CRITICAL: SYNC_SECRET is missing in environment variables. Sync API disabled for security.');
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    // 2. Authorization check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncPostgresToMysql();

    if (result.success) {
      return NextResponse.json({ message: 'Sync completed successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Sync failed', details: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('API /sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
