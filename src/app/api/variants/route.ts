import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// Helper function to add Indonesian aliases to variant
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

// GET all variants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    const variants = await db.variant.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { price: 'asc' },
    });

    // Add Indonesian aliases
    const variantsWithAlias = variants.map(addVariantAliases);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: variantsWithAlias,
    });
  } catch (error) {
    console.error('Get variants error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil varian',
    }, { status: 500 });
  }
}

// POST create new variant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantName, price, stock, sku } = body;

    // Validate input
    if (!productId || !variantName || !price || !sku) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    // Check if SKU already exists
    const existingVariant = await db.variant.findUnique({
      where: { sku },
    });

    if (existingVariant) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'SKU sudah ada',
      }, { status: 409 });
    }

    // Create variant
    const variant = await db.variant.create({
      data: {
        id: generateId('var'),
        productId,
        variantName,
        price,
        stock: stock || 0,
        sku,
        isActive: true,
      },
      include: {
        product: true,
      },
    });

    // Add Indonesian aliases
    const variantWithAlias = addVariantAliases(variant);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: variantWithAlias,
      message: 'Varian berhasil ditambahkan',
    }, { status: 201 });
  } catch (error) {
    console.error('Create variant error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat varian',
    }, { status: 500 });
  }
}
