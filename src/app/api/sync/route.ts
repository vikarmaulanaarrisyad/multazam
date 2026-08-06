import { NextResponse } from 'next/server';
import { syncPostgresToMysql } from '@/lib/sync';

// Security check to ensure only authorized requests can trigger the sync
const SYNC_SECRET = process.env.SYNC_SECRET || 'default-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    // Basic authorization check
    const authHeader = request.headers.get('authorization');
    
    // In production, enforce secret validation
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${SYNC_SECRET}`) {
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
