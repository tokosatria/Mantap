import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappToEmail } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noWhatsapp, password } = body;

    // Validasi input
    if (!noWhatsapp || !password) {
      return NextResponse.json(
        { success: false, message: 'No. WhatsApp dan password harus diisi' },
        { status: 400 }
      );
    }

    // Convert WhatsApp number to email for Supabase Auth
    const email = whatsappToEmail(noWhatsapp);

    // Create Supabase client (no storage for auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Login dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: 'No. WhatsApp atau password salah' },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Gagal login ke Supabase Auth' },
        { status: 500 }
      );
    }

    // Ambil data user dari database
    const user = await db.user.findUnique({
      where: { id: authData.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Data user tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Akun Anda tidak aktif' },
        { status: 403 }
      );
    }

    // Response dengan data user
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        nama: user.nama,
        noKtp: user.noKtp,
        noWhatsapp: user.noWhatsapp,
        alamat: user.alamat,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    // Set cookies from session
    const session = authData.session;
    const { access_token, refresh_token, expires_in } = session;

    // Set access token cookie
    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in || 3600,
      path: '/',
    });

    // Set refresh token cookie
    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
