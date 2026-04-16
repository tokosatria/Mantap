import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API] Fetching active QRIS from database...');

    // Get the active QRIS image
    const activeQris = await db.qrisImage.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[API] Active QRIS result:', activeQris);

    if (!activeQris) {
      console.log('[API] No active QRIS found in database');
      return NextResponse.json(
        { success: false, error: 'No active QRIS found' },
        { status: 404 }
      );
    }

    console.log('[API] Returning active QRIS:', {
      id: activeQris.id,
      name: activeQris.name,
      imageUrl: activeQris.imageUrl
    });

    return NextResponse.json({
      success: true,
      data: activeQris,
    });
  } catch (error) {
    console.error('[API] Get active QRIS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get active QRIS' },
      { status: 500 }
    );
  }
}
