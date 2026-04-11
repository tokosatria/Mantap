import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
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

// GET cart items
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    const cartItems = await db.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    // Add Indonesian aliases to variants
    const cartItemsWithAlias = cartItems.map(item => ({
      ...item,
      variant: item.variant ? addVariantAliases(item.variant) : null,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cartItemsWithAlias,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil keranjang',
    }, { status: 500 });
  }
}

// POST add to cart
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
    const { variantId, quantity } = body;

    if (!variantId || !quantity || quantity < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Variant ID dan quantity wajib diisi',
      }, { status: 400 });
    }

    // Check if variant exists and is active
    const variant = await db.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Varian tidak ditemukan',
      }, { status: 404 });
    }

    if (!variant.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Varian tidak tersedia',
      }, { status: 400 });
    }

    // Check if item already in cart using findFirst instead of findUnique
    const existingCartItem = await db.cartItem.findFirst({
      where: {
        userId,
        variantId,
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;

      if (newQuantity > variant.stock) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Stok tidak mencukupi',
        }, { status: 400 });
      }

      cartItem = await db.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      if (quantity > variant.stock) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Stok tidak mencukupi',
        }, { status: 400 });
      }

      cartItem = await db.cartItem.create({
        data: {
          id: generateId('cart'),
          userId,
          variantId,
          quantity,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Add Indonesian aliases to variant
    const cartItemWithAlias = {
      ...cartItem,
      variant: cartItem.variant ? addVariantAliases(cartItem.variant) : null,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: cartItemWithAlias,
      message: 'Berhasil ditambahkan ke keranjang',
    }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat menambahkan ke keranjang',
    }, { status: 500 });
  }
}

// DELETE cart item
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Tidak terautentikasi',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');

    if (cartItemId) {
      // Delete specific cart item
      await db.cartItem.deleteMany({
        where: {
          id: cartItemId,
          userId,
        },
      });
    } else {
      // Clear all cart items for user
      await db.cartItem.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Keranjang berhasil diupdate',
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate keranjang',
    }, { status: 500 });
  }
}
