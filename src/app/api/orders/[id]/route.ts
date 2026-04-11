import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { ApiResponse } from '@/types';

// Helper function to add product to items
function addProductToItems(order: any) {
  return {
    ...order,
    items: order.items ? order.items.map((item: any) => ({
      ...item,
      product: item.variant?.product, // Include product at item level for easier access
    })) : [],
  };
}

// GET single order
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

    // Admin can view any order, users can only view their own
    const where: any = currentUser.role === 'admin' ? { id } : { id, userId };

    const order = await db.order.findFirst({
      where,
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
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan tidak ditemukan',
      }, { status: 404 });
    }

    // Add product to items
    const orderWithProduct = addProductToItems(order);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: orderWithProduct,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil pesanan',
    }, { status: 500 });
  }
}

// PUT update order status
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
    const { status, cancelReason } = body;

    const validStatuses = ['pending', 'confirmed', 'paid', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Status tidak valid',
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan tidak ditemukan',
      }, { status: 404 });
    }

    // Update order
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    if (status === 'cancelled' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
      for (const item of existingOrder.items) {
        await db.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
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
        user: true,
      },
    });

    // Add product to items
    const orderWithProduct = addProductToItems(order);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: orderWithProduct,
      message: 'Pesanan berhasil diupdate',
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate pesanan',
    }, { status: 500 });
  }
}

// PATCH for admin to update order status (with stock management) and modify items
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
    const { status, items, action } = body;

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan tidak ditemukan',
      }, { status: 404 });
    }

    // Handle item modifications (add/remove/update quantity)
    if (action === 'updateItems' && items && Array.isArray(items)) {
      const updatedItems: any[] = [];
      let totalAmount = 0;

      for (const newItem of items) {
        const existingItem = existingOrder.items.find(
          (item: any) => item.variantId === newItem.variantId
        );

        if (existingItem) {
          // Update existing item
          const quantityDiff = newItem.quantity - existingItem.quantity;

          if (quantityDiff > 0) {
            // Increasing quantity - check stock and deduct
            const variant = await db.variant.findUnique({
              where: { id: newItem.variantId },
            });
            if (!variant || variant.stock < quantityDiff) {
              return NextResponse.json<ApiResponse>({
                success: false,
                error: `Stok tidak mencukupi untuk item ini`,
              }, { status: 400 });
            }
            await db.variant.update({
              where: { id: newItem.variantId },
              data: { stock: { decrement: quantityDiff } },
            });
          } else if (quantityDiff < 0) {
            // Decreasing quantity - restore stock
            await db.variant.update({
              where: { id: newItem.variantId },
              data: { stock: { increment: Math.abs(quantityDiff) } },
            });
          }

          if (newItem.quantity > 0) {
            updatedItems.push({
              ...existingItem,
              quantity: newItem.quantity,
            });
            totalAmount += existingItem.price * newItem.quantity;
          }
          // If quantity is 0, the item is removed (not added to updatedItems)
        } else if (newItem.quantity > 0) {
          // Add new item
          const variant = await db.variant.findUnique({
            where: { id: newItem.variantId },
            include: { product: true },
          });

          if (!variant) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: `Varian tidak ditemukan`,
            }, { status: 404 });
          }

          if (variant.stock < newItem.quantity) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: `Stok tidak mencukupi`,
            }, { status: 400 });
          }

          // Deduct stock
          await db.variant.update({
            where: { id: newItem.variantId },
            data: { stock: { decrement: newItem.quantity } },
          });

          updatedItems.push({
            variantId: newItem.variantId,
            quantity: newItem.quantity,
            price: variant.price,
          });
          totalAmount += variant.price * newItem.quantity;
        }
      }

      // Delete removed items from database and update existing items
      const updatedVariantIds = updatedItems.map((item: any) => item.variantId);

      // First, delete items that are not in the updated list
      for (const existingItem of existingOrder.items) {
        if (!updatedVariantIds.includes(existingItem.variantId)) {
          await db.orderItem.delete({
            where: { id: existingItem.id },
          });
        } else {
          // Update existing item quantity
          const updatedItem = updatedItems.find((ui: any) => ui.variantId === existingItem.variantId);
          if (updatedItem && updatedItem.quantity !== existingItem.quantity) {
            await db.orderItem.update({
              where: { id: existingItem.id },
              data: { quantity: updatedItem.quantity },
            });
          }
        }
      }

      // Create new items (items that don't exist in original order)
      const newItems = updatedItems.filter(
        (ui: any) => !existingOrder.items.some((ei: any) => ei.variantId === ui.variantId)
      );

      if (newItems.length > 0) {
        for (const newItem of newItems) {
          await db.orderItem.create({
            data: {
              orderId: id,
              variantId: newItem.variantId,
              quantity: newItem.quantity,
              price: newItem.price,
            },
          });
        }
      }

      // Update total amount
      await db.order.update({
        where: { id },
        data: { totalAmount },
      });

      // Fetch updated order
      const order = await db.order.findUnique({
        where: { id },
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
          user: true,
        },
      });

      const orderWithProduct = addProductToItems(order);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: orderWithProduct,
        message: 'Pesanan berhasil diupdate',
      });
    }

    // Handle status update only
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'paid', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Status tidak valid',
        }, { status: 400 });
      }

      // Update order
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      // If cancelling, restore stock
      if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
        for (const item of existingOrder.items) {
          await db.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const order = await db.order.update({
        where: { id },
        data: updateData,
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
          user: true,
        },
      });

      // Add product to items
      const orderWithProduct = addProductToItems(order);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: orderWithProduct,
        message: 'Status pesanan berhasil diubah',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Parameter tidak valid',
    }, { status: 400 });
  } catch (error) {
    console.error('Patch order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate pesanan',
    }, { status: 500 });
  }
}
