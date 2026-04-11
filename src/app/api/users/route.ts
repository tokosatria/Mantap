import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId, validateKTP, validateWhatsApp } from '@/lib/utils';
import { ApiResponse } from '@/types';

// GET all users (admin only)
export async function GET(request: NextRequest) {
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

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nama: true,
        noKtp: true,
        noWhatsapp: true,
        alamat: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil users',
    }, { status: 500 });
  }
}

// POST create new user (admin only)
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
    const { nama, noKtp, noWhatsapp, alamat, password, role } = body;

    // Validate input
    if (!nama || !noKtp || !noWhatsapp || !alamat || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    // Validate KTP
    if (!validateKTP(noKtp)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nomor KTP/NPWP harus 16 digit angka',
      }, { status: 400 });
    }

    // Validate WhatsApp
    if (!validateWhatsApp(noWhatsapp)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nomor WhatsApp tidak valid',
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password minimal 6 karakter',
      }, { status: 400 });
    }

    // Check if noKtp already exists
    const existingKtp = await db.user.findUnique({
      where: { noKtp },
    });

    if (existingKtp) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nomor KTP/NPWP sudah terdaftar',
      }, { status: 409 });
    }

    // Check if noWhatsapp already exists
    const existingWhatsApp = await db.user.findUnique({
      where: { noWhatsapp },
    });

    if (existingWhatsApp) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nomor WhatsApp sudah terdaftar',
      }, { status: 409 });
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        id: generateId('usr'),
        nama,
        noKtp,
        noWhatsapp,
        alamat,
        password,
        role: role || 'agen',
        isActive: true,
      },
      select: {
        id: true,
        nama: true,
        noKtp: true,
        noWhatsapp: true,
        alamat: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: newUser,
      message: 'User berhasil ditambahkan',
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat user',
    }, { status: 500 });
  }
}
