import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappToEmail } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, noKtp, noWhatsapp, alamat, password } = body;

    // Validasi input
    if (!nama || !noKtp || !noWhatsapp || !password) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah noKtp sudah terdaftar di database
    const existingKtp = await db.user.findUnique({
      where: { noKtp },
    });

    if (existingKtp) {
      return NextResponse.json(
        { success: false, message: 'No. KTP sudah terdaftar' },
        { status: 409 }
      );
    }

    // Cek apakah noWhatsapp sudah terdaftar di database
    const existingWhatsapp = await db.user.findUnique({
      where: { noWhatsapp },
    });

    if (existingWhatsapp) {
      return NextResponse.json(
        { success: false, message: 'No. WhatsApp sudah terdaftar' },
        { status: 409 }
      );
    }

    // Convert WhatsApp number to email for Supabase Auth
    const email = whatsappToEmail(noWhatsapp);

    // Cek apakah noWhatsapp ada di list admin dari .env
    const adminWhatsappNumbers = process.env.ADMIN_WHATSAPP_NUMBERS || '';
    const adminNumbers = adminWhatsappNumbers
      .split(',')
      .map(num => num.trim())
      .filter(num => num.length > 0);

    // Tentukan role berdasarkan noWhatsapp
    const isAdmin = adminNumbers.includes(noWhatsapp);
    const role = isAdmin ? 'admin' : 'agen';

    console.log(`Register check: noWhatsapp=${noWhatsapp}, isAdmin=${isAdmin}, role=${role}`);
    console.log(`Admin numbers:`, adminNumbers);

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

    // Register user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama,
          noKtp,
          noWhatsapp,
          alamat,
        },
      },
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { success: false, message: `Gagal register di Supabase Auth: ${authError.message}` },
        { status: 400 }
      );
    }

    // Jika user tidak dibuat (mungkin email sudah ada)
    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat user di Supabase Auth' },
        { status: 500 }
      );
    }

    // Simpan data tambahan di tabel User database
    const newUser = await db.user.create({
      data: {
        id: authData.user.id, // Gunakan ID dari Supabase Auth
        nama,
        noKtp,
        noWhatsapp,
        alamat,
        password: '', // Password tidak perlu disimpan lagi, karena sudah di Supabase Auth
        role, // 'admin' jika noWhatsapp ada di ADMIN_WHATSAPP_NUMBERS, 'agen' jika tidak
        isActive: true,
      },
    });

    // Response dengan data user (tanpa password)
    const response = NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: newUser.id,
        nama: newUser.nama,
        noKtp: newUser.noKtp,
        noWhatsapp: newUser.noWhatsapp,
        alamat: newUser.alamat,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
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
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
