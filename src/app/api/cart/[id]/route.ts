import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { ApiResponse } from '@/types';

// PATCH update cart item quantity
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

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Quantity wajib diisi dan minimal 1',
      }, { status: 400 });
    }

    // Check if cart item exists and belongs to user
    const cartItem = await db.cartItem.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Item keranjang tidak ditemukan',
      }, { status: 404 });
    }

    // Check stock
    if (quantity > cartItem.variant.stock) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Stok tidak mencukupi',
      }, { status: 400 });
    }

    // Update quantity
    const updatedCartItem = await db.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedCartItem,
      message: 'Jumlah berhasil diupdate',
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate keranjang',
    }, { status: 500 });
  }
}
