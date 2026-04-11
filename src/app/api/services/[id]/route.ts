import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse } from '@/types';

// GET single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await db.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Jasa tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil jasa',
    }, { status: 500 });
  }
}

// PUT update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;

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
    const { name, category, description, price, duration, isActive } = body;

    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Jasa tidak ditemukan',
      }, { status: 404 });
    }

    // Update service
    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(duration && { duration }),
        ...(isActive !== undefined && { status: isActive ? 'active' : 'inactive' }),
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service,
      message: 'Jasa berhasil diupdate',
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate jasa',
    }, { status: 500 });
  }
}

// PATCH for toggle status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;

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
      const service = await db.service.findUnique({
        where: { id },
      });

      if (!service) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Jasa tidak ditemukan',
        }, { status: 404 });
      }

      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      const updatedService = await db.service.update({
        where: { id },
        data: { status: newStatus },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updatedService,
        message: 'Status jasa berhasil diubah',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Action tidak valid',
    }, { status: 400 });
  } catch (error) {
    console.error('Patch service error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate jasa',
    }, { status: 500 });
  }
}

// DELETE service (soft delete - set status to deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;

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

    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Jasa tidak ditemukan',
      }, { status: 404 });
    }

    // Soft delete (set status to deleted)
    await db.service.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Jasa berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat menghapus jasa',
    }, { status: 500 });
  }
}
