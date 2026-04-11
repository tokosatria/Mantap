import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// Helper function to add Indonesian aliases to product
function addProductAliases(product: any) {
  return {
    ...product,
    nama: product.name,
    deskripsi: product.description,
    harga: product.basePrice,
    gambar: product.imageUrl,
    category: product.category ? {
      ...product.category,
      nama: product.category.name,
    } : null,
    variants: product.variants ? product.variants.map((v: any) => ({
      ...v,
      nama: v.variantName,
      harga: v.price,
      stok: v.stock,
    })) : [],
  };
}

// GET all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add Indonesian aliases
    const productsWithAlias = products.map(addProductAliases);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: productsWithAlias,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil produk',
    }, { status: 500 });
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, categoryId, variants } = body;

    // Validate input with specific error messages
    if (!name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Nama produk wajib diisi',
      }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Deskripsi produk wajib diisi',
      }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Gambar produk wajib diisi',
      }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kategori produk wajib diisi',
      }, { status: 400 });
    }

    // Validate variants
    if (!variants || variants.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Minimal harus ada 1 varian produk',
      }, { status: 400 });
    }

    // Validate variant data
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.variantName) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Nama varian #${i + 1} wajib diisi`,
        }, { status: 400 });
      }
      if (variant.price === undefined || variant.price === null || variant.price === '') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Harga varian #${i + 1} wajib diisi`,
        }, { status: 400 });
      }
      if (variant.stock === undefined || variant.stock === null || variant.stock === '') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Stok varian #${i + 1} wajib diisi`,
        }, { status: 400 });
      }
    }

    // Calculate basePrice from first variant (lowest price)
    const basePrice = Math.min(...variants.map((v: any) => Number(v.price) || 0));

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Kategori tidak ditemukan',
      }, { status: 404 });
    }

    // Create product with variants
    const productId = generateId('prd');
    const product = await db.product.create({
      data: {
        id: productId,
        name,
        description,
        basePrice,
        imageUrl,
        categoryId,
        isActive: true,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v: any, index: number) => ({
                id: generateId('var'),
                variantName: v.variantName,
                price: v.price,
                hpp: v.hpp || 0,
                stock: v.stock || 0,
                sku: v.sku || `SKU-${productId}-${index + 1}-${Date.now()}`,
                isActive: true,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    // Add Indonesian aliases
    const productWithAlias = addProductAliases(product);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: productWithAlias,
      message: 'Produk berhasil ditambahkan',
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat membuat produk',
    }, { status: 500 });
  }
}
