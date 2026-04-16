import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientForApi, getCurrentUserId } from '@/lib/supabase';
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

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access only' },
        { status: 403 }
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
    const activatedQris = await db.qrisImage.update({
      where: { id: qrisId },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: activatedQris,
    });
  } catch (error: any) {
    console.error('Activate QRIS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate QRIS' },
      { status: 500 }
    );
  }
}
