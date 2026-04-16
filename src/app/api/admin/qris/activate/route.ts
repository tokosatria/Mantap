import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { qrisId } = body;

    if (!qrisId) {
      return NextResponse.json(
        { success: false, error: 'QRIS ID is required' },
        { status: 400 }
      );
    }

    // Deactivate all QRIS images
    await db.qrisImage.updateMany({
      data: { isActive: false },
    });

    // Activate the selected QRIS
    await db.qrisImage.update({
      where: {
        id: qrisId,
      },
      data: {
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'QRIS activated successfully',
    });
  } catch (error) {
    console.error('Activate QRIS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate QRIS' },
      { status: 500 }
    );
  }
}
