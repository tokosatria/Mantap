import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId, generateOrderNumber } from '@/lib/utils';
import { ApiResponse } from '@/types';

// Helper function to add Indonesian aliases
function addVariantAliases(variant: any) {
  return {
    ...variant,
    nama: variant.variantName,
    harga: variant.price,
    stok: variant.stock,
    product: variant.product ? {
      ...variant.product,
      nama: variant.product.name,
      deskripsi: variant.product.description,
      harga: variant.product.basePrice,
      gambar: variant.product.imageUrl,
    } : null,
  };
}

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

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

    if (!currentUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User tidak ditemukan',
      }, { status: 404 });
    }

    // If admin, get all orders; otherwise, get only user's orders
    const where: any = currentUser.role === 'admin' ? {} : { userId };
    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        user: true,
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
    });

    // Add Indonesian aliases to variants
    const ordersWithAlias = orders.map(order => ({
      ...order,
      items: order.items ? order.items.map(item => ({
        ...item,
        variant: item.variant ? addVariantAliases(item.variant) : null,
        product: item.variant?.product, // Also include product at item level for easier access
      })) : [],
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: ordersWithAlias,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil pesanan',
    }, { status: 500 });
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    const body = await request.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Items wajib diisi',
      }, { status: 400 });
    }

    // Type for order item data
    type OrderItemData = {
      id: string;
      variantId: string;
      quantity: number;
      price: number;
    };

    // Validate and calculate total
    let totalAmount = 0;
    const orderItems: OrderItemData[] = [];

    for (const item of items) {
      const variant = await db.variant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Varian dengan ID ${item.variantId} tidak ditemukan`,
        }, { status: 404 });
      }

      if (!variant.isActive) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Varian ${variant.variantName} tidak tersedia`,
        }, { status: 400 });
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Stok ${variant.variantName} tidak mencukupi`,
        }, { status: 400 });
      }

      const itemTotal = variant.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        id: generateId('itm'),
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.price,
      });
    }

    // Create order
    const order = await db.order.create({
      data: {
        id: generateId('ord'),
        userId,
        orderNumber: generateOrderNumber(),
        status: 'pending',
        totalAmount,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        user: true,
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
    });

    // Update stock
    for (const item of items) {
      await db.variant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear user's cart after successful order
    await db.cartItem.deleteMany({
      where: { userId },
    });

    // Add Indonesian aliases to variants
    const orderWithAlias = {
      ...order,
      items: order.items ? order.items.map(item => ({
        ...item,
        variant: item.variant ? addVariantAliases(item.variant) : null,
        product: item.variant?.product, // Also include product at item level for easier access
      })) : [],
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: orderWithAlias,
      message: 'Pesanan berhasil dibuat',
    }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat pesanan',
    }, { status: 500 });
  }
}
