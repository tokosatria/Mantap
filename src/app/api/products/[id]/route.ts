import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
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

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    // Add Indonesian aliases
    const productWithAlias = addProductAliases(product);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: productWithAlias,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil produk',
    }, { status: 500 });
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, imageUrl, categoryId, variants, isActive } = body;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    // Update product with variants
    const updateData: any = {
      ...(name && { name }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive }),
    };

    // Handle variants update
    if (variants && Array.isArray(variants)) {
      // Get all existing variants with their order item counts
      const existingVariants = await db.variant.findMany({
        where: { productId: id },
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
      });

      // Separate variants based on whether they have orders
      const variantsWithOrders = existingVariants.filter(v => v._count.orderItems > 0);
      const variantsWithoutOrders = existingVariants.filter(v => v._count.orderItems === 0);

      // Delete only variants that don't have orders
      if (variantsWithoutOrders.length > 0) {
        await db.variant.deleteMany({
          where: {
            id: { in: variantsWithoutOrders.map(v => v.id) },
          },
        });
      }

      // Process each variant from the request
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const variantData = {
          productId: id,
          variantName: v.variantName,
          price: v.price,
          hpp: v.hpp || 0,
          stock: v.stock,
          isActive: true,
        };

        // If variant has an ID, update it (if it exists and belongs to this product)
        if (v.id) {
          const existingVariant = existingVariants.find(ev => ev.id === v.id);
          if (existingVariant) {
            await db.variant.update({
              where: { id: v.id },
              data: variantData,
            });
          }
        } else {
          // Create new variant with SKU
          await db.variant.create({
            data: {
              ...variantData,
              sku: `SKU-${id}-${i + 1}-${Date.now()}`,
            },
          });
        }
      }

      // Update basePrice to lowest variant price
      const lowestPrice = Math.min(...variants.map((v: any) => v.price || 0));
      updateData.basePrice = lowestPrice;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
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
      message: 'Produk berhasil diupdate',
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate produk',
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
      const product = await db.product.findUnique({
        where: { id },
      });

      if (!product) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Produk tidak ditemukan',
        }, { status: 404 });
      }

      const updatedProduct = await db.product.update({
        where: { id },
        data: { isActive: !product.isActive },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updatedProduct,
        message: 'Status produk berhasil diubah',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Action tidak valid',
    }, { status: 400 });
  } catch (error) {
    console.error('Patch product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate produk',
    }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    // Soft delete (set isActive to false)
    await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Produk berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat menghapus produk',
    }, { status: 500 });
  }
}
