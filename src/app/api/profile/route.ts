import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nama, noKtp, noWhatsapp, alamat } = body;

    // Validasi input
    if (!nama || !noKtp || !noWhatsapp || !alamat) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if noKtp is already used by another user
    if (noKtp !== currentUser.noKtp) {
      const existingKtp = await db.user.findUnique({
        where: { noKtp },
      });

      if (existingKtp && existingKtp.id !== userId) {
        return NextResponse.json(
          { success: false, message: 'No. KTP sudah digunakan oleh user lain' },
          { status: 409 }
        );
      }
    }

    // Check if noWhatsapp is already used by another user
    if (noWhatsapp !== currentUser.noWhatsapp) {
      const existingWhatsapp = await db.user.findUnique({
        where: { noWhatsapp },
      });

      if (existingWhatsapp && existingWhatsapp.id !== userId) {
        return NextResponse.json(
          { success: false, message: 'No. WhatsApp sudah digunakan oleh user lain' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        nama,
        noKtp,
        noWhatsapp,
        alamat,
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

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profil berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui profil' },
      { status: 500 }
    );
  }
}
