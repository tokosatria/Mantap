import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/supabase';
import { ApiResponse } from '@/types';

// GET single service order
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

    // Admin can view any service order
    const serviceOrder = await db.serviceOrder.findUnique({
      where: { id },
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
    });

    if (!serviceOrder) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan service tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Get service order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengambil pesanan service',
    }, { status: 500 });
  }
}

// PATCH update service order (admin only)
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
    const {
      action,
      status,
      dpAmount,
      finalPrice,
      notes,
      cancelReason,
      spareparts,
    } = body;

    // Check if service order exists
    const existingOrder = await db.serviceOrder.findUnique({
      where: { id },
      include: {
        spareparts: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan service tidak ditemukan',
      }, { status: 404 });
    }

    // Handle different actions
    if (action === 'updateStatus') {
      const validStatuses = ['pending', 'in_progress', 'dp_paid', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Status tidak valid',
        }, { status: 400 });
      }

      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      if (status === 'cancelled' && cancelReason) {
        updateData.cancelReason = cancelReason;
      }

      const serviceOrder = await db.serviceOrder.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          service: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceOrder,
        message: 'Status pesanan service berhasil diubah',
      });
    }

    if (action === 'recordDP') {
      if (!dpAmount || dpAmount <= 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Jumlah DP harus lebih dari 0',
        }, { status: 400 });
      }

      const serviceOrder = await db.serviceOrder.update({
        where: { id },
        data: {
          dpAmount,
          paymentStatus: 'partial',
          status: 'dp_paid',
        },
        include: {
          user: true,
          service: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceOrder,
        message: 'DP berhasil dicatat',
      });
    }

    if (action === 'completeService') {
      if (!finalPrice || finalPrice < 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Harga final harus diisi',
        }, { status: 400 });
      }

      // Calculate spareparts total
      let sparepartsTotal = 0;
      const sparepartsWithVariants: any[] = [];

      if (spareparts && Array.isArray(spareparts) && spareparts.length > 0) {
        // Validate and calculate spareparts
        for (const sp of spareparts) {
          if (!sp.variantId || !sp.quantity || sp.quantity <= 0) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: 'Data sparepart tidak valid',
            }, { status: 400 });
          }

          // Check if variant exists and has enough stock
          const variant = await db.variant.findUnique({
            where: { id: sp.variantId },
          });

          if (!variant) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: `Variant ${sp.variantId} tidak ditemukan`,
            }, { status: 404 });
          }

          if (variant.stock < sp.quantity) {
            return NextResponse.json<ApiResponse>({
              success: false,
              error: `Stok ${variant.variantName} tidak cukup. Tersedia: ${variant.stock}, Diminta: ${sp.quantity}`,
            }, { status: 400 });
          }

          // Use price and hpp from variant if not provided
          const price = sp.price || variant.price;
          const hpp = sp.hpp || variant.hpp;

          sparepartsTotal += price * sp.quantity;
          sparepartsWithVariants.push({
            ...sp,
            price,
            hpp,
            variantName: variant.variantName,
          });
        }

        // Process each sparepart
        for (const sp of sparepartsWithVariants) {
          // Create sparepart record
          await db.serviceOrderSparepart.create({
            data: {
              serviceOrderId: id,
              variantId: sp.variantId,
              quantity: sp.quantity,
              price: sp.price,
              cost: sp.hpp,
            },
          });

          // Decrease variant stock
          await db.variant.update({
            where: { id: sp.variantId },
            data: {
              stock: {
                decrement: sp.quantity,
              },
            },
          });
        }

        // Create Order for spareparts sales (for reporting purposes)
        // Only create order if there's a valid userId (not service panggilan)
        if (sparepartsWithVariants.length > 0 && existingOrder.userId) {
          // Generate order number
          const orderCount = await db.order.count();
          const orderNumber = `SP-${String(orderCount + 1).padStart(6, '0')}`;

          // Create Order
          const order = await db.order.create({
            data: {
              userId: existingOrder.userId,
              orderNumber,
              status: 'completed',
              totalAmount: sparepartsTotal,
              source: 'service',
              serviceOrderId: id,
              notes: `Sparepart untuk Service Order #${existingOrder.orderNumber}`,
              completedAt: new Date(),
            },
          });

          // Create OrderItems for each sparepart
          for (const sp of sparepartsWithVariants) {
            await db.orderItem.create({
              data: {
                orderId: order.id,
                variantId: sp.variantId,
                quantity: sp.quantity,
                price: sp.price,
                status: 'completed',
              },
            });
          }
        }
      }

      const remainingAmount = finalPrice - existingOrder.dpAmount;
      const paymentStatus = remainingAmount <= 0 ? 'paid' : 'partial';

      const serviceOrder = await db.serviceOrder.update({
        where: { id },
        data: {
          finalPrice,
          remainingAmount,
          paymentStatus,
          status: 'completed',
          completedAt: new Date(),
          sparepartsTotal,
        },
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
      });

      const totalBill = finalPrice + sparepartsTotal;
      const totalPaid = existingOrder.dpAmount;
      const remaining = totalBill - totalPaid;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceOrder,
        message: `Pekerjaan service selesai. Total: Rp ${finalPrice.toLocaleString('id-ID')} (Jasa) + Rp ${sparepartsTotal.toLocaleString('id-ID')} (Sparepart) = Rp ${totalBill.toLocaleString('id-ID')}. Sisa pembayaran: Rp ${Math.max(0, remaining).toLocaleString('id-ID')}`,
      });
    }

    if (action === 'updateNotes') {
      const serviceOrder = await db.serviceOrder.update({
        where: { id },
        data: { notes },
        include: {
          user: true,
          service: true,
        },
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceOrder,
        message: 'Catatan berhasil diupdate',
      });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Action tidak valid',
    }, { status: 400 });
  } catch (error) {
    console.error('Patch service order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate pesanan service',
    }, { status: 500 });
  }
}

// DELETE service order (soft delete - set status to cancelled)
export async function DELETE(
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

    // Check if service order exists
    const existingOrder = await db.serviceOrder.findUnique({
      where: { id },
      include: {
        spareparts: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Pesanan service tidak ditemukan',
      }, { status: 404 });
    }

    // If service was completed and had spareparts, restore stock
    if (existingOrder.status === 'completed' && existingOrder.spareparts.length > 0) {
      for (const sp of existingOrder.spareparts) {
        await db.variant.update({
          where: { id: sp.variantId },
          data: {
            stock: {
              increment: sp.quantity,
            },
          },
        });
      }
    }

    // Soft delete (set status to cancelled)
    await db.serviceOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Pesanan service berhasil dibatalkan',
    });
  } catch (error) {
    console.error('Delete service order error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Terjadi kesalahan saat menghapus pesanan service',
    }, { status: 500 });
  }
}
