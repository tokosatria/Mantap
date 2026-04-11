'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ShoppingBag, Package, CheckCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: string;
    nama: string;
    harga: number;
    stok: number;
    product: {
      id: string;
      nama: string;
      gambar: string;
    };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCartItems(data.data);
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Keranjang kosong');
      return;
    }

    if (!confirm('Konfirmasi pesanan Anda?')) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            variantId: item.variant.id,
            quantity: item.quantity,
            price: item.variant.harga,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Dispatch event to update cart count in header (cart will be cleared)
        window.dispatchEvent(new Event('cartUpdate'));
        // Dispatch event to update pending orders count in header
        window.dispatchEvent(new Event('orderUpdate'));
        alert('Pesanan berhasil dibuat!');
        router.push('/orders');
      } else {
        alert(data.error || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('Place order error:', error);
      alert('Terjadi kesalahan saat membuat pesanan');
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.variant.harga * item.quantity), 0);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 md:pt-24 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-(--accent-primary) border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-(--text-muted)">Memuat keranjang...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-20 md:pt-24 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-(--text-muted)" />
              <h1 className="font-display font-bold text-2xl mb-2">Keranjang Kosong</h1>
              <p className="text-(--text-muted) mb-6">
                Belum ada barang di keranjang Anda
              </p>
              <button
                onClick={() => router.push('/products')}
                className="btn-primary inline-flex items-center gap-2"
              >
                Belanja Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Background Effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <main className="pt-20 md:pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
              Checkout
            </h1>
            <p className="text-(--text-secondary)">
              Review pesanan Anda sebelum checkout
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items Pesanan
              </h2>
              
              {cartItems.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-(--bg-elevated) shrink-0">
                    <img
                      src={item.variant.product.gambar}
                      alt={item.variant.product.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="#1e1e1e" width="96" height="96"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">No Image</text></svg>'
                        );
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 line-clamp-2">
                      {item.variant.product.nama}
                    </h3>
                    <p className="text-sm text-(--text-secondary) mb-2">
                      {item.variant.nama}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {formatCurrency(item.variant.harga)}
                      </p>
                      <p className="text-sm text-(--text-muted)">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(item.variant.harga * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ringkasan Pesanan
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Total Item</span>
                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} item</span>
                  </div>
                  <div className="border-t border-(--border-color) pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-xl">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Pesan Sekarang</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push('/products')}
                  className="w-full mt-3 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                >
                  ← Lanjut Belanja
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
