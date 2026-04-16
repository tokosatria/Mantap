import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get the active QRIS image
    const activeQris = await db.qrisImage.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

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
    console.error('[API] Get active QRIS error:', error);
    
    // Check if error is about missing table
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { success: false, error: 'QrisImage table does not exist. Please run database migration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to get active QRIS' },
      { status: 500 }
    );
  }
}
