import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Sign out dari Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase Auth signOut error:', error);
      // Tetap lanjutkan untuk membersihkan cookie
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    });

    // Hapus cookie userId (untuk backward compatibility dengan sesi lama)
    response.cookies.delete('userId');

    // Hapus Supabase auth cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
