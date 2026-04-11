import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// POST create new service call (home service) - public access (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      itemDescription,
      problemDescription,
      preferredDate,
      notes,
    } = body;

    // Validate input
    if (!customerName || !customerPhone || !itemDescription || !problemDescription) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nama, No HP, Nama Barang, dan Keluhan wajib diisi',
      }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `CALL_${Date.now()}`;

    // Create service order for home service
    const serviceOrder = await db.serviceOrder.create({
      data: {
        id: generateId('svo'),
        userId: null,
        serviceId: null,
        orderNumber,
        customerName,
        customerPhone,
        customerAddress: '-',
        itemDescription,
        problemDescription,
        serviceType: 'panggilan',
        preferredDate: preferredDate || null,
        estimatedPrice: 0,
        dpAmount: 0,
        finalPrice: 0,
        remainingAmount: 0,
        sparepartsTotal: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: notes || null,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceOrder,
      message: 'Permintaan Service Panggilan berhasil dikirim. Kami akan segera menghubungi Anda.',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengirim permintaan Service Panggilan',
    }, { status: 500 });
  }
}
