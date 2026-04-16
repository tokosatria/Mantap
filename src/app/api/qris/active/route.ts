import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('[QRIS Active] Fetching active QRIS...');

    // Get:: active QRIS image
    const activeQris = await db.qrisImage.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[QRIS Active] Result:', activeQris ? 'Found' : 'Not found');

    if (!activeQris) {
      return NextResponse.json(
        { success: false, error: 'No active QRIS found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activeQris,
    });
  } catch (error: any) {
    console.error('[QRIS Active] Error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200), // Limit stack trace
    });
    
    // Check if error is about missing table
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { success: false, error: 'QrisImage table does not exist. Please run database migration.' },
        { status: 500 }
      );
    }
    
    // Check if error is about connection
    if (error?.code === 'P1001' || error?.message?.includes('connection') || error?.message?.includes('connect')) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Check DATABASE_URL environment variable.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to get active QRIS', details: error?.message },
      { status: 500 }
    );
  }
}
