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
  } catch (error: any) {
    console.error('List QRIS error:', error);
    
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { success: false, error: 'QrisImage table does not exist. Please run database migration.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to list QRIS images' },
      { status: 500 }
    );
  }
}
