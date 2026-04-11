import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { ApiResponse } from '@/types';

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    // Check if user is admin or requesting own data
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak memiliki akses',
      }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
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
        orders: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil user',
    }, { status: 500 });
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    // Check if user is admin or updating own data
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak memiliki akses',
      }, { status: 403 });
    }

    const body = await request.json();
    const { nama, alamat, role, isActive } = body;

    // Only admin can change role and isActive
    if ((role !== undefined || isActive !== undefined) && currentUser.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak memiliki akses untuk mengubah role/active status',
      }, { status: 403 });
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(alamat && { alamat }),
        ...(role && currentUser.role === 'admin' && { role }),
        ...(isActive !== undefined && currentUser.role === 'admin' && { isActive }),
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
      data: user,
      message: 'User berhasil diupdate',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate user',
    }, { status: 500 });
  }
}

// DELETE deactivate user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Soft delete (set isActive to false)
    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User berhasil dinonaktifkan',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat menonaktifkan user',
    }, { status: 500 });
  }
}

// PATCH for toggle status and reset password (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { action } = body;

    if (action === 'toggleStatus') {
      const user = await db.user.findUnique({
        where: { id },
      });

      if (!user) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'User tidak ditemukan',
        }, { status: 404 });
      }

      const updatedUser = await db.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          nama: true,
          role: true,
          isActive: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updatedUser,
        message: 'Status user berhasil diubah',
      });
    }

    if (action === 'resetPassword') {
      // Generate random password
      const newPassword = Math.random().toString(36).slice(-8);

      const updatedUser = await db.user.update({
        where: { id },
        data: { password: newPassword },
        select: {
          id: true,
          nama: true,
          noWhatsapp: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { user: updatedUser, newPassword },
        message: 'Password berhasil direset',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Action tidak valid',
    }, { status: 400 });
  } catch (error) {
    console.error('Patch user error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate user',
    }, { status: 500 });
  }
}
