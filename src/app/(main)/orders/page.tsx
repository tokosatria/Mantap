'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { formatDate, getStatusColor, formatCurrency } from '@/lib/utils';
import { Package, Eye, Filter } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/orders${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <main className="pt-20 md:pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
              Pesanan Saya
            </h1>
            <p className="text-(--text-secondary)">
              Kelola dan lacak pesanan Anda
            </p>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Filter className="w-5 h-5 text-(--text-muted)" />
            <button
              onClick={() => setFilterStatus('')}
              className={`category-tab ${filterStatus === '' ? 'active' : ''}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`category-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`category-tab ${filterStatus === 'confirmed' ? 'active' : ''}`}
            >
              Dikonfirmasi
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`category-tab ${filterStatus === 'paid' ? 'active' : ''}`}
            >
              Dibayar
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`category-tab ${filterStatus === 'completed' ? 'active' : ''}`}
            >
              Selesai
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`category-tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
            >
              Dibatalkan
            </button>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="card p-6 animate-pulse"
                  style={{ height: '200px' }}
                />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">#{order.orderNumber}</span>
                        <span className={`badge badge-${order.status === 'cancelled' ? 'danger' : order.status === 'completed' ? 'success' : order.status === 'paid' ? 'info' : 'warning'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-(--text-muted)">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-sm text-(--text-muted)">
                        {order.items?.length || 0} item
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-(--border-color) pt-4">
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.variant?.product?.name}
                              </p>
                              <p className="text-xs text-(--text-muted)">
                                {item.variant?.variantName}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                              <p className="text-(--text-muted)">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="border-t border-(--border-color) pt-4 mt-4">
                      <p className="text-sm text-(--text-muted)">
                        <span className="font-medium">Catatan:</span> {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-elevated) flex items-center justify-center">
                <Package className="w-8 h-8 text-(--text-muted)" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Belum ada pesanan</h3>
              <p className="text-(--text-muted) mb-6">
                Mulai belanja sekarang untuk membuat pesanan pertama Anda
              </p>
              <a
                href="/products"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Package className="w-5 h-5" />
                Lihat Produk
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
