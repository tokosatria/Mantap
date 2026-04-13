'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, User, LogOut, FileText, Trash2, Minus, Plus, Wrench, X } from 'lucide-react';
import { User as UserType, UserWithoutPassword } from '@/types/index';
import { formatCurrency } from '@/lib/utils';
import ServiceCallModal from '@/components/ServiceCallModal';

interface HeaderProps {
  currentUser?: UserWithoutPassword | null;
}

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

export default function Header({ currentUser }: HeaderProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [showServiceCallModal, setShowServiceCallModal] = useState(false);
  const router = useRouter();

  // Handle back button to close cart drawer
  useEffect(() => {
    if (cartOpen) {
      // Add a history entry when cart drawer opens
      window.history.pushState({ drawerOpen: true, drawerType: 'cart' }, '');

      // Handle back button press
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.drawerOpen && event.state?.drawerType === 'cart') {
          // Close cart drawer when back button is pressed
          setCartOpen(false);
        }
      };

      window.addEventListener('popstate', handlePopState);

      // Cleanup
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // Remove the extra history entry when drawer closes normally (via X button or checkout)
        if (window.history.state?.drawerOpen && window.history.state?.drawerType === 'cart') {
          window.history.back();
        }
      };
    }
  }, [cartOpen]);

  const fetchCartCount = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCartCount(data.data.reduce((sum: number, item: any) => sum + item.quantity, 0));
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
    }
  };

  const fetchPendingOrderCount = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        const pendingOrders = data.data.filter((order: any) => order.status === 'pending').length;
        setPendingOrderCount(pendingOrders);
      }
    } catch (error) {
      console.error('Fetch pending orders error:', error);
    }
  };

  const fetchCartItems = async () => {
    if (!currentUser) return;
    setLoadingCart(true);
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCartItems(data.data);
        setCartCount(data.data.reduce((sum: number, item: any) => sum + item.quantity, 0));
      }
    } catch (error) {
      console.error('Fetch cart items error:', error);
    } finally {
      setLoadingCart(false);
    }
  };

  const updateQuantity = async (cartItemId: string, delta: number) => {
    const item = cartItems.find(i => i.id === cartItemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity < 1) {
      // Ask confirmation before removing
      if (confirm('Hapus item ini dari keranjang?')) {
        await deleteCartItem(cartItemId);
      }
      return;
    }

    if (newQuantity > item.variant.stok) {
      alert('Stok tidak mencukupi');
      return;
    }

    try {
      const res = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (res.ok) {
        // Update local state
        setCartItems(items =>
          items.map(i => (i.id === cartItemId ? { ...i, quantity: newQuantity } : i))
        );
        setCartCount(prev => prev + delta);
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      alert('Gagal mengupdate jumlah');
    }
  };

  const deleteCartItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' });

      if (res.ok) {
        const item = cartItems.find(i => i.id === cartItemId);
        setCartItems(items => items.filter(i => i.id !== cartItemId));
        if (item) {
          setCartCount(prev => prev - item.quantity);
        }
      }
    } catch (error) {
      console.error('Delete cart item error:', error);
      alert('Gagal menghapus item');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Keranjang kosong');
      return;
    }
    router.push('/checkout');
    setCartOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchPendingOrderCount();
  }, [currentUser]);

  // Listen for cart update events from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    const handleOrderUpdate = () => {
      fetchPendingOrderCount();
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    window.addEventListener('orderUpdate', handleOrderUpdate);
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
      window.removeEventListener('orderUpdate', handleOrderUpdate);
    };
  }, [currentUser]);

  useEffect(() => {
    if (cartOpen && currentUser) {
      fetchCartItems();
    }
  }, [cartOpen, currentUser]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg" id="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Vertical Layout */}
            <a
              href="/"
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-sm sm:text-base text-white">SE</span>
            </a>

            {/* Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-2">
              <a
                href="/"
                className="nav-link active"
              >
                Beranda
              </a>
              <a
                href="/products"
                className="nav-link"
              >
                Produk
              </a>
              {currentUser && (
                <>
                  <a
                    href="/orders"
                    className="nav-link relative"
                  >
                    Pesanan
                    {pendingOrderCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {pendingOrderCount}
                      </span>
                    )}
                  </a>
                  {currentUser.role === 'admin' && (
                    <a
                      href="/admin"
                      className="nav-link"
                    >
                      Admin
                    </a>
                  )}
                </>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Service Call Button */}
              <button
                onClick={() => setShowServiceCallModal(true)}
                className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px] group"
                aria-label="Service Panggilan"
              >
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  Service panggilan
                </span>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px] group relative"
                aria-label="Keranjang Belanja"
              >
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300 relative">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white text-blue-600 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-bold shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  Keranjang
                </span>
              </button>

              {/* User Menu */}
              {currentUser ? (
                <>
                  {/* User Info */}
                  <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
                    <a
                      href="/orders"
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                        {currentUser.nama.split(' ')[0]}
                      </span>
                    </a>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px] group"
                    aria-label="Logout"
                  >
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-red-500/40 hover:border-red-400/50 transition-all duration-300">
                      <LogOut className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <a
                  href="/login"
                  className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px] group"
                  aria-label="Login"
                >
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    Login/daftar
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Cart Drawer */}
      <div
        className={`cart-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
      />
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="font-display font-bold text-xl">Keranjang Belanja</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loadingCart ? (
            <p className="text-center text-[var(--text-muted)]">Memuat...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-center text-[var(--text-muted)]">Keranjang kosong</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-[var(--bg-elevated)]">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-card)]">
                    <img
                      src={item.variant.product.gambar}
                      alt={item.variant.product.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#1e1e1e" width="80" height="80"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">No Image</text></svg>'
                        );
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {item.variant.product.nama}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">
                      {item.variant.nama}
                    </p>
                    <p className="font-semibold text-sm">
                      {formatCurrency(item.variant.harga)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => deleteCartItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-400 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.variant.stok}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  cartItems.reduce((sum, item) => sum + (item.variant.harga * item.quantity), 0)
                )}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              {cartCount} item di keranjang
            </p>
            <button
              onClick={handleCheckout}
              className="btn-primary w-full"
            >
              Checkout
            </button>
          </div>
        )}
      </aside>

      {/* Service Call Modal */}
      <ServiceCallModal
        isOpen={showServiceCallModal}
        onClose={() => setShowServiceCallModal(false)}
      />
    </>
  );
}
