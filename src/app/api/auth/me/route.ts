import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSupabaseClientForApi } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Ambil user dari Supabase Auth dengan client yang bisa baca cookies
    const supabaseClient = await createSupabaseClientForApi();
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    // Auth errors are expected when user is not logged in, don't log as error
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi aktif' },
        { status: 401 }
      );
    }

    // Cari data user di database
    const userData = await db.user.findUnique({
      where: { id: user.id },
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

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Refresh session dari Supabase Auth dengan client yang bisa baca cookies
    const supabaseClient = await createSupabaseClientForApi();
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    // Auth errors are expected when user is not logged in, don't log as error
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi aktif' },
        { status: 401 }
      );
    }

    // Cari data user di database
    const userData = await db.user.findUnique({
      where: { id: session.user.id },
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

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Refresh user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
