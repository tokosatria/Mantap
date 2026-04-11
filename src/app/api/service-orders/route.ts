import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// GET all service orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const serviceOrders = await db.serviceOrder.findMany({
      where,
      include: {
        user: true,
        service: true,
        spareparts: {
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
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceOrders,
    });
  } catch (error) {
    console.error('Get service orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil pesanan service',
    }, { status: 500 });
  }
}

// POST create new service order
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    // Check if user is admin or agen
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User tidak ditemukan',
      }, { status: 404 });
    }

    const body = await request.json();
    const {
      serviceId,
      customerName,
      customerPhone,
      customerAddress,
      itemDescription,
      problemDescription,
      dpAmount,
      notes,
    } = body;

    // Validate input
    if (!serviceId || !customerName || !customerPhone || !customerAddress || !itemDescription) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Semua field wajib diisi kecuali DP',
      }, { status: 400 });
    }

    // Check if service exists
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Jasa service tidak ditemukan',
      }, { status: 404 });
    }

    // Generate order number
    const orderNumber = `SRV_${Date.now()}`;

    // Calculate initial payment status
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (dpAmount && dpAmount > 0) {
      paymentStatus = 'partial';
    }

    // Create service order
    const serviceOrder = await db.serviceOrder.create({
      data: {
        id: generateId('svo'),
        userId,
        serviceId,
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        itemDescription,
        problemDescription: problemDescription || '',
        estimatedPrice: service.price,
        dpAmount: dpAmount || 0,
        finalPrice: 0, // Will be set when work is completed
        remainingAmount: 0, // Will be calculated when finalPrice is set
        status: 'pending',
        paymentStatus,
        notes,
      },
      include: {
        user: true,
        service: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceOrder,
      message: 'Pesanan service berhasil dibuat',
    }, { status: 201 });
  } catch (error) {
    console.error('Create service order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat pesanan service',
    }, { status: 500 });
  }
}
