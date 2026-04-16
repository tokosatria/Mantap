import { NextResponse } from 'next/server';
import { createSupabaseClientForApi, getCurrentUserId } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all QRIS images
    const qrisImages = await db.qrisImage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: qrisImages,
    });
  } catch (error) {
    console.error('List QRIS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list QRIS images' },
      { status: 500 }
    );
  }
}
