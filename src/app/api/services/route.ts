import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// GET all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const services = await db.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil jasa',
    }, { status: 500 });
  }
}

// POST create new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak memiliki akses',
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, price, duration } = body;

    // Validate input
    if (!name || !category || !description || !price || !duration) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    // Create service
    const service = await db.service.create({
      data: {
        id: generateId('svc'),
        name,
        category,
        description,
        price,
        duration,
        status: 'active',
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service,
      message: 'Jasa berhasil ditambahkan',
    }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat jasa',
    }, { status: 500 });
  }
}
