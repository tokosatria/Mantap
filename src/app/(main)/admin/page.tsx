'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithoutPassword, Order, Product, Category, Service, Variant } from '@/types';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Trash2,
  Plus,
  Edit,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  Wrench,
  FileText,
  Upload,
  Image as ImageIcon,
  Printer,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import ReportsTab from './ReportsTab';
import PrintReceipt from '@/components/PrintReceipt';
import PrintServiceReceipt from '@/components/PrintServiceReceipt';

type TabType = 'overview' | 'products' | 'orders' | 'users' | 'services' | 'reports';

type Stats = {
  totalRevenue: number;
  pendingOrders: number;
  pendingProductOrders: number;
  pendingServiceOrders: number;
  totalProducts: number;
  lowStockVariants: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<UserWithoutPassword | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingOrders: 0,
    pendingProductOrders: 0,
    pendingServiceOrders: 0,
    totalProducts: 0,
    lowStockVariants: 0,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
        if (data.data.role !== 'admin') {
          // Use router.push to preserve history - back button will work correctly
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Use router.push to preserve history - back button will work correctly
      router.push('/');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch products count
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      const products = productsData.success ? productsData.data : [];

      // Fetch orders
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      const orders = ordersData.success ? ordersData.data : [];
      const pendingProductOrders = orders.filter((o: Order) => o.status === 'pending').length;
      const orderRevenue = orders
        .filter((o: Order) => o.status === 'completed')
        .reduce((sum: number, o: Order) => sum + o.totalAmount, 0);

      // Fetch service orders
      const serviceOrdersRes = await fetch('/api/service-orders');
      const serviceOrdersData = await serviceOrdersRes.json();
      const serviceOrders = serviceOrdersData.success ? serviceOrdersData.data : [];
      const pendingServiceOrders = serviceOrders.filter((o: any) => o.status === 'pending').length;
      const serviceRevenue = serviceOrders
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + (o.finalPrice || 0), 0);

      // Calculate low stock variants
      const lowStockCount = products.reduce((sum: number, product: Product) => {
        return sum + (product.variants?.filter((v: Variant) => v.stock < 5).length || 0);
      }, 0);

      setStats({
        totalRevenue: orderRevenue + serviceRevenue,
        pendingOrders: pendingProductOrders + pendingServiceOrders,
        pendingProductOrders,
        pendingServiceOrders,
        totalProducts: products.length,
        lowStockVariants: lowStockCount,
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-mesh" />
      <div className="fixed inset-0 -z-10 noise-overlay" />

      <main className="min-h-screen pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">
              Dashboard Admin
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Kelola Satria Elektronik dan pantau penjualan
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--border-color)] pb-4 overflow-x-auto sticky top-0 bg-[var(--bg-primary)] z-10">
            {[
              { id: 'overview', label: 'Dashboard', icon: TrendingUp, count: null },
              {
                id: 'orders',
                label: 'Pesanan',
                icon: ShoppingCart,
                count: stats.pendingProductOrders > 0 ? stats.pendingProductOrders : null
              },
              {
                id: 'products',
                label: 'Produk',
                icon: Package,
                count: stats.lowStockVariants > 0 ? stats.lowStockVariants : null
              },
              {
                id: 'services',
                label: 'Jasa Service',
                icon: Wrench,
                count: stats.pendingServiceOrders > 0 ? stats.pendingServiceOrders : null
              },
              { id: 'users', label: 'Users', icon: Users, count: null },
              { id: 'reports', label: 'Laporan', icon: FileText, count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-purple-500/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} onRefresh={fetchStats} />
          )}
          {activeTab === 'orders' && <OrdersTab onRefresh={fetchStats} />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'services' && <ServicesTab onRefresh={fetchStats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
      </main>
    </>
  );
}

// Overview Tab with Stats and Low Stock Alert
function OverviewTab({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  const [lowStockVariants, setLowStockVariants] = useState<any[]>([]);

  const fetchLowStockVariants = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        const products = data.data;
        const lowStock: any[] = [];
        products.forEach((product: Product) => {
          product.variants?.forEach((variant: Variant) => {
            if (variant.stock < 5) {
              lowStock.push({
                ...variant,
                productName: product.name,
              });
            }
          });
        });
        setLowStockVariants(lowStock);
      }
    } catch (error) {
      console.error('Fetch low stock error:', error);
    }
  };

  useEffect(() => {
    fetchLowStockVariants();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="text-green-500"
          bgColor="bg-green-500/10"
          subtitle="Total pendapatan"
        />
        <StatCard
          title="Pending"
          value={stats.pendingOrders}
          icon={Clock}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
          subtitle="Pesanan menunggu"
        />
        <StatCard
          title="Produk"
          value={stats.totalProducts}
          icon={Package}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          subtitle="Produk aktif"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockVariants}
          icon={AlertTriangle}
          color="text-red-500"
          bgColor="bg-red-500/10"
          subtitle="Varian stok rendah"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockVariants.length > 0 ? (
        <div className="card p-6 border-red-500/30">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Peringatan Stok Rendah
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Stok</th>
                  <th>Harga</th>
                </tr>
              </thead>
              <tbody>
                {lowStockVariants.map((v, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{v.productName || '-'}</td>
                    <td>{v.variantName || '-'}</td>
                    <td>
                      <span className="badge badge-danger">{v.stock || 0}</span>
                    </td>
                    <td>{formatCurrency(v.price || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <p className="text-[var(--text-secondary)]">Semua varian produk memiliki stok yang cukup</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
}: any) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <span className={`text-xs font-medium ${color}`}>{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</div>
    </div>
  );
}

// Orders Tab with complete actions
function OrdersTab({ onRefresh }: { onRefresh: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrderItems, setEditingOrderItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // Handle back button for order detail modal
  useEffect(() => {
    if (selectedOrder) {
      window.history.pushState({ modalOpen: true, modalType: 'orderDetail' }, '');

      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modalOpen && event.state?.modalType === 'orderDetail') {
          setSelectedOrder(null);
          setIsEditing(false);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modalOpen && window.history.state?.modalType === 'orderDetail') {
          window.history.back();
        }
      };
    }
  }, [selectedOrder]);

  // Handle back button for add item modal
  useEffect(() => {
    if (showAddItemModal) {
      window.history.pushState({ modalOpen: true, modalType: 'addItem' }, '');

      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modalOpen && event.state?.modalType === 'addItem') {
          setShowAddItemModal(false);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modalOpen && window.history.state?.modalType === 'addItem') {
          window.history.back();
        }
      };
    }
  }, [showAddItemModal]);

  // Keyboard event listener for Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
        setIsEditing(false);
        setShowAddItemModal(false);
        setPrintOrder(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
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

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        onRefresh();
        // Dispatch event to update pending orders count in header
        window.dispatchEvent(new Event('orderUpdate'));
        alert(`Status pesanan diubah menjadi ${newStatus}`);
      }
    } catch (error) {
      console.error('Update order error:', error);
      alert('Gagal mengupdate status pesanan');
    }
  };

  const handleEditItems = () => {
    if (selectedOrder) {
      setEditingOrderItems(
        selectedOrder.items?.map((item: any) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          product: item.variant?.product,
          variant: item.variant,
        })) || []
      );
      setIsEditing(true);
    }
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const newItems = [...editingOrderItems];
    const newQuantity = Math.max(0, newItems[index].quantity + delta);
    newItems[index].quantity = newQuantity;
    setEditingOrderItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editingOrderItems.filter((_, i) => i !== index);
    setEditingOrderItems(newItems);
  };

  const handleAddItem = (variantId: string, quantity: number) => {
    const product = products.find((p) =>
      p.variants?.some((v) => v.id === variantId)
    );
    const variant = product?.variants?.find((v) => v.id === variantId);

    if (variant) {
      const existingIndex = editingOrderItems.findIndex(
        (item) => item.variantId === variantId
      );

      if (existingIndex >= 0) {
        const newItems = [...editingOrderItems];
        newItems[existingIndex].quantity += quantity;
        setEditingOrderItems(newItems);
      } else {
        setEditingOrderItems([
          ...editingOrderItems,
          {
            variantId,
            quantity,
            price: variant.price,
            product,
            variant,
          },
        ]);
      }
    }
    setShowAddItemModal(false);
  };

  const handleSaveItems = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateItems',
          items: editingOrderItems,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setIsEditing(false);
        fetchOrders();
        onRefresh();
        alert('Pesanan berhasil diupdate');
      } else {
        alert(data.error || 'Gagal mengupdate pesanan');
      }
    } catch (error) {
      console.error('Update order items error:', error);
      alert('Gagal mengupdate pesanan');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingOrderItems([]);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      paid: 'Sudah Bayar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      paid: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const calculateTotal = () => {
    return editingOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h3 className="font-display font-bold text-lg">Kelola Pesanan</h3>
      </div>
      {loading ? (
        <div className="p-6 text-center">Loading...</div>
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Pembeli</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono font-medium">{order.orderNumber}</td>
                    <td>{order.user?.nama || '-'}</td>
                    <td className="text-sm text-[var(--text-muted)]">{formatDate(order.createdAt)}</td>
                    <td className="font-semibold">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              Konfirmasi
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Batalkan semua item? Stok akan dikembalikan.')) {
                                  updateOrderStatus(order.id, 'cancelled');
                                }
                              }}
                              className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              Batalkan Semua
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            className="px-3 py-1 text-xs rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            Bayar
                          </button>
                        )}
                        {order.status === 'paid' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="px-3 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          >
                            Selesai
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsEditing(false);
                          }}
                          className="px-3 py-1 text-xs rounded-lg bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handlePrint(order)}
                          className="px-3 py-1 text-xs rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-[var(--text-muted)]">Belum ada pesanan</div>
      )}

      {/* Order Detail Modal with Item Edit */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setSelectedOrder(null);
            setIsEditing(false);
          }}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full my-4 flex flex-col shadow-2xl min-h-fit relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - absolute positioned for maximum visibility */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(null);
                setIsEditing(false);
              }}
              className="absolute -top-3 -right-3 z-[10000] w-12 h-12 rounded-full bg-red-500 border-2 border-red-600 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 shadow-xl transition-all duration-200"
              title="Tutup (Esc)"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6 border-b border-[var(--border-color)] flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between pr-12">
                <h3 className="font-display font-bold text-xl">Detail Pesanan</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder(null);
                    setIsEditing(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all duration-200 font-semibold"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div>
                <p className="text-sm text-[var(--text-muted)]">No. Pesanan</p>
                <p className="font-mono font-medium">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Pembeli</p>
                <p className="font-medium">{selectedOrder.user?.nama}</p>
                <p className="text-sm">{selectedOrder.user?.noWhatsapp}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Status</p>
                <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[var(--text-muted)]">Item Pesanan</p>
                  {selectedOrder.status === 'pending' && !isEditing && (
                    <button
                      onClick={handleEditItems}
                      className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit Item
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {(isEditing ? editingOrderItems : selectedOrder.items)?.map((item: any, idx: number) => (
                    <div key={item.variantId || idx} className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">{item.variant?.product?.name || item.product?.name}</span>
                          <p className="text-sm text-[var(--text-muted)] truncate">{item.variant?.variantName}</p>
                          <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <button
                              onClick={() => handleQuantityChange(idx, -1)}
                              className="w-6 h-6 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(idx, 1)}
                              className="w-6 h-6 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="ml-2 p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm flex-shrink-0 ml-3">{formatCurrency(item.price)} x {item.quantity}</span>
                        )}
                      </div>
                      {isEditing && item.quantity > 0 && (
                        <div className="mt-2 text-sm text-right text-[var(--text-muted)]">
                          Subtotal: {formatCurrency(item.price * item.quantity)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Item
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 border-t border-[var(--border-color)] pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(isEditing ? calculateTotal() : selectedOrder.totalAmount)}</span>
                </div>
              </div>
              {isEditing && (
                <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button
                    onClick={handleCancelEdit}
                    className="btn-secondary flex-1"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveItems}
                    className="btn-primary flex-1"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <AddItemModal
          products={products}
          onAdd={handleAddItem}
          onClose={() => setShowAddItemModal(false)}
        />
      )}

      {/* Print Receipt */}
      {printOrder && (
        <PrintReceipt
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({
  products,
  onAdd,
  onClose,
}: {
  products: Product[];
  onAdd: (variantId: string, quantity: number) => void;
  onClose: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAdd = () => {
    if (selectedVariantId && quantity > 0) {
      onAdd(selectedVariantId, quantity);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xl">Tambah Item ke Pesanan</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
              title="Tutup (Esc)"
            >
              <X className="w-6 h-6" />
              <span className="font-semibold">Tutup</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Pilih Produk
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId('');
              }}
              className="input-field"
            >
              <option value="">-- Pilih Produk --</option>
              {products
                .filter((p) => p.isActive && p.variants && p.variants.length > 0)
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
            </select>
          </div>
          {selectedProduct && selectedProduct.variants && (
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Pilih Varian
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Pilih Varian --</option>
                {selectedProduct.variants
                  .filter((v) => v.isActive && v.stock > 0)
                  .map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.variantName} - {formatCurrency(variant.price)} (Stok: {variant.stock})
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Jumlah
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input-field"
            />
          </div>
          <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-[var(--border-color)]">
            <button onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedVariantId || quantity < 1}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab with complete management
function UsersTab() {
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle back button for add user modal
  useEffect(() => {
    if (showAddUserModal) {
      window.history.pushState({ modalOpen: true, modalType: 'addUser' }, '');

      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modalOpen && event.state?.modalType === 'addUser') {
          setShowAddUserModal(false);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modalOpen && window.history.state?.modalType === 'addUser') {
          window.history.back();
        }
      };
    }
  }, [showAddUserModal]);

  const fetchData = async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/orders'),
      ]);
      const usersData = await usersRes.json();
      const ordersData = await ordersRes.json();
      if (usersData.success) setUsers(usersData.data);
      if (ordersData.success) setOrders(ordersData.data);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert('Status user berhasil diubah');
      }
    } catch (error) {
      console.error('Toggle user error:', error);
      alert('Gagal mengubah status user');
    }
  };

  const resetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Reset password untuk ${user.nama}? Password baru akan dikirim via WhatsApp.`)) {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resetPassword' }),
        });
        const data = await res.json();
        if (data.success) {
          alert('Password berhasil direset. Password baru: ' + data.data.newPassword);
        }
      } catch (error) {
        console.error('Reset password error:', error);
        alert('Gagal reset password');
      }
    }
  };

  const addUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        alert('User berhasil ditambahkan');
        setShowAddUserModal(false);
        fetchData();
      } else {
        alert(result.message || 'Gagal menambah user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      alert('Gagal menambah user');
    }
  };

  const getUserTotalSpent = (userId: string) => {
    return orders
      .filter(o => o.userId === userId && o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Manajemen Pengguna</h3>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Peran</th>
                  <th>No WhatsApp</th>
                  <th>Total Belanja</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="font-medium">{user.nama}</div>
                        <div className="text-xs text-[var(--text-muted)]">ID: {user.id}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Agen'}
                      </span>
                    </td>
                    <td>{user.noWhatsapp || '-'}</td>
                    <td className="font-semibold">{formatCurrency(getUserTotalSpent(user.id))}</td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => resetPassword(user.id)}
                            className="px-3 py-1 text-xs rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                          >
                            Reset Password
                          </button>
                        )}
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className="px-3 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                        >
                          {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)]">Belum ada user</div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Tambah User Baru</h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nama Lengkap / Perusahaan</label>
                <input
                  type="text"
                  name="nama"
                  required
                  placeholder="PT Maju Bersama"
                  className="input-field"
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nomor KTP / NPWP</label>
                <input
                  type="text"
                  name="noKtp"
                  required
                  placeholder="16 digit nomor KTP/NPWP"
                  className="input-field"
                  pattern="[0-9]{16}"
                  title="Harus 16 digit angka"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nomor WhatsApp</label>
                <input
                  type="tel"
                  name="noWhatsapp"
                  required
                  placeholder="08xxxxxxxxxx"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Alamat Lengkap</label>
                <textarea
                  name="alamat"
                  required
                  placeholder="Jl. Nama Jalan No.xx, Kota, Provinsi"
                  className="input-field resize-none"
                  rows={3}
                  minLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Peran</label>
                <select name="role" required className="input-field">
                  <option value="agen">Agen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min. 6 karakter"
                  className="input-field"
                  minLength={6}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Tambah User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Products Tab with variants and complete management
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [descriptionPreset, setDescriptionPreset] = useState('manual');
  const [showManualDescription, setShowManualDescription] = useState(false);
  const [categoryPreset, setCategoryPreset] = useState('manual');
  const [showManualCategory, setShowManualCategory] = useState(false);
  const [manualCategory, setManualCategory] = useState('');

  // Preset description options
  const descriptionPresets = [
    { id: 'manual', label: 'Isi Manual / Lainnya' },
    { id: 'standard', label: 'Produk berkualitas tinggi dengan harga terjangkau. Cocok untuk kebutuhan sehari-hari.' },
    { id: 'premium', label: 'Produk premium dengan kualitas terbaik. Dilengkapi dengan garansi dan layanan purna jual.' },
    { id: 'eco', label: 'Produk ramah lingkungan dan hemat energi. Solusi cerdas untuk masa depan yang lebih baik.' },
    { id: 'basic', label: 'Produk dasar dengan fungsionalitas lengkap. Pilihan tepat untuk budget terbatas.' },
  ];

  const [formData, setFormData] = useState<any>({
    name: '',
    categoryId: '',
    description: '',
    imageUrl: '',
    variants: [{ variantName: '', price: 0, hpp: 0, stock: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      if (productsData.success && Array.isArray(productsData.data)) setProducts(productsData.data);
      if (categoriesData.success && Array.isArray(categoriesData.data)) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If manual category is selected, check if exists or create new
    let finalCategoryId = formData.categoryId;
    if (categoryPreset === 'manual' && manualCategory.trim()) {
      const categoryName = manualCategory.trim();

      // First, check if category already exists in the current list
      const existingCategory = categories.find(c =>
        c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory) {
        // Category already exists, use its ID
        finalCategoryId = existingCategory.id;
      } else {
        // Try to create new category
        try {
          const catRes = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: categoryName,
              icon: '📦' // Default icon for manual categories
            }),
          });
          const catData = await catRes.json();

          if (catData.success && catData.data) {
            // Successfully created
            finalCategoryId = catData.data.id;
            // Refresh categories list
            fetchData();
          } else if (catRes.status === 409 || catData.error?.includes('sudah ada')) {
            // Category already exists in database, fetch all categories
            const allCatRes = await fetch('/api/categories');
            const allCatData = await allCatRes.json();
            if (allCatData.success && Array.isArray(allCatData.data)) {
              setCategories(allCatData.data);
              const dbCategory = allCatData.data.find((c: any) =>
                c.name.toLowerCase() === categoryName.toLowerCase()
              );
              if (dbCategory) {
                finalCategoryId = dbCategory.id;
              } else {
                alert('Kategori sudah ada tapi tidak dapat ditemukan. Silakan pilih dari daftar.');
                return;
              }
            } else {
              alert('Gagal memuat daftar kategori. Silakan refresh halaman.');
              return;
            }
          } else {
            alert(catData.error || 'Gagal membuat kategori baru');
            return;
          }
        } catch (error) {
          console.error('Create category error:', error);
          alert('Gagal membuat kategori baru');
          return;
        }
      }
    }

    // Validate that we have a category ID
    if (!finalCategoryId) {
      alert('Silakan pilih kategori atau isi kategori manual');
      return;
    }

    // Update form data with final category ID
    const submitData = { ...formData, categoryId: finalCategoryId };

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Produk ${editingProduct ? 'diedit' : 'ditambahkan'} berhasil`);
        setShowProductModal(false);
        setEditingProduct(null);
        fetchData();
      } else {
        alert(data.error || data.message || 'Gagal menyimpan produk');
      }
    } catch (error) {
      console.error('Save product error:', error);
      alert('Gagal menyimpan produk');
    }
  };

  const toggleProductStatus = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Toggle product error:', error);
      alert('Gagal mengubah status produk');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFormData((prev: any) => ({ ...prev, imageUrl: data.data.url }));
        alert(`Gambar berhasil diupload!\nUkuran asli: ${(data.data.originalSize / 1024).toFixed(2)} KB\nUkuran setelah kompresi: ${(data.data.size / 1024).toFixed(2)} KB\nRasio kompresi: ${data.data.compressionRatio}%`);
      } else {
        alert(data.message || 'Gagal mengupload gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gagal mengupload gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDescriptionPresetChange = (value: string) => {
    const selected = descriptionPresets.find(p => p.id === value);
    if (selected) {
      if (value === 'manual') {
        setShowManualDescription(true);
        setFormData((prev: any) => ({ ...prev, description: '' }));
      } else {
        setShowManualDescription(false);
        setFormData((prev: any) => ({ ...prev, description: selected.label }));
      }
    }
    setDescriptionPreset(value);
  };

  const handleCategoryPresetChange = (value: string) => {
    if (value === 'manual') {
      setShowManualCategory(true);
      setFormData((prev: any) => ({ ...prev, categoryId: '' }));
    } else {
      setShowManualCategory(false);
      setFormData((prev: any) => ({ ...prev, categoryId: value }));
    }
    setCategoryPreset(value);
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchData();
          alert('Produk berhasil dihapus');
        }
      } catch (error) {
        console.error('Delete product error:', error);
        alert('Gagal menghapus produk');
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      imageUrl: product.imageUrl,
      variants: product.variants || [],
    });
    setShowProductModal(true);
  };

  const addVariantField = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { variantName: '', price: 0, hpp: 0, stock: 0 }],
    });
  };

  const updateVariantField = (index: number, field: string, value: any) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const removeVariantField = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Manajemen Produk</h3>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                categoryId: '',
                description: '',
                imageUrl: '',
                variants: [{ variantName: '', price: 0, hpp: 0, stock: 0 }],
              });
              setDescriptionPreset('manual');
              setShowManualDescription(true);
              setCategoryPreset('manual');
              setShowManualCategory(true);
              setManualCategory('');
              setUploadingImage(false);
              setShowProductModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Varian</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-[var(--text-muted)] line-clamp-1">{product.description || ''}</div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">{category?.icon || '📦'} {category?.name || 'Tidak Ada Kategori'}</span>
                      </td>
                      <td>
                        <div className="text-xs">
                          {(product.variants || []).map((variant, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="font-medium">{variant.variantName || 'Nama Varian'}</span>
                              <span className="text-[var(--text-muted)] ml-2">Stok: {variant.stock || 0}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {(product.variants || []).map((variant, idx) => (
                            <div key={idx} className="mb-1">{formatCurrency(variant.price || 0)}</div>
                          ))}
                        </div>
                      </td>
                      <td className="font-semibold">{totalStock}</td>
                      <td>
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {product.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleProductStatus(product.id)}
                            className="px-3 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          >
                            {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)]">Belum ada produk</div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nama Produk</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Laptop Gaming"
                    className="input-field"
                    minLength={3}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Kategori</label>
                  <select
                    className="input-field mb-3"
                    value={categoryPreset}
                    onChange={(e) => handleCategoryPresetChange(e.target.value)}
                  >
                    <option value="manual">Isi Manual / Lainnya</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  {(showManualCategory || categoryPreset === 'manual') && (
                    <input
                      type="text"
                      placeholder="Nama kategori baru"
                      className="input-field"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      required={categoryPreset === 'manual'}
                      minLength={2}
                    />
                  )}
                  {categoryPreset !== 'manual' && (
                    <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)]">
                      {categories?.find(c => c.id === categoryPreset)?.icon} {categories?.find(c => c.id === categoryPreset)?.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Deskripsi</label>
                <select
                  className="input-field mb-3"
                  value={descriptionPreset}
                  onChange={(e) => handleDescriptionPresetChange(e.target.value)}
                >
                  {descriptionPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.id === 'manual' ? preset.label : `${preset.id.charAt(0).toUpperCase() + preset.id.slice(1)}: ${preset.label.substring(0, 50)}...`}
                    </option>
                  ))}
                </select>
                {(showManualDescription || descriptionPreset === 'manual') && (
                  <textarea
                    name="description"
                    required
                    placeholder="Deskripsi produk"
                    className="input-field resize-none"
                    rows={3}
                    minLength={10}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                )}
                {descriptionPreset !== 'manual' && (
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)]">
                    {formData.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Gambar URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="imageUrl"
                    required
                    placeholder="https://example.com/image.jpg"
                    className="input-field flex-1"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                {formData.imageUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)]">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1e1e1e" width="100" height="100"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">No Image</text></svg>');
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-muted)] break-all">
                        {formData.imageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Varian Produk</label>
                <div className="space-y-3">
                  {formData.variants.map((variant: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg bg-[var(--bg-elevated)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Varian #{index + 1}</span>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantField(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Nama Varian (contoh: Merah, XL)"
                        className="input-field"
                        value={variant.variantName}
                        onChange={(e) => updateVariantField(index, 'variantName', e.target.value)}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Harga Jual</label>
                          <input
                            type="text"
                            placeholder="Contoh: 25000"
                            className="input-field"
                            value={variant.price || ''}
                            onChange={(e) => {
                              // Hapus semua titik dan karakter non-angka kecuali minus
                              const cleanValue = e.target.value.replace(/[^0-9-]/g, '');
                              updateVariantField(index, 'price', cleanValue ? Number(cleanValue) : 0);
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">HPP (Modal)</label>
                          <input
                            type="text"
                            placeholder="Contoh: 20000"
                            className="input-field"
                            value={variant.hpp || ''}
                            onChange={(e) => {
                              const cleanValue = e.target.value.replace(/[^0-9-]/g, '');
                              updateVariantField(index, 'hpp', cleanValue ? Number(cleanValue) : 0);
                            }}
                          />
                          <p className="text-xs text-[var(--text-muted)] mt-1">Disembunyikan dari publik</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Stok</label>
                        <input
                          type="text"
                          placeholder="Contoh: 10"
                          className="input-field"
                          value={variant.stock || ''}
                          onChange={(e) => {
                            // Hapus semua karakter non-angka
                            const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                            updateVariantField(index, 'stock', cleanValue ? Number(cleanValue) : 0);
                          }}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addVariantField}
                  className="mt-3 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  + Tambah Varian
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Services Tab (Jasa Service)
function ServicesTab({ onRefresh }: { onRefresh?: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showServiceOrderModal, setShowServiceOrderModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDPModal, setShowDPModal] = useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<any>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'orders'>('catalog');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'toko' | 'panggilan'>('all');
  const [printServiceOrder, setPrintServiceOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'elektronik',
    description: '',
    price: 0,
    duration: '1 jam',
  });
  const [orderFormData, setOrderFormData] = useState({
    serviceId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    itemDescription: '',
    problemDescription: '',
    dpAmount: '',
    notes: '',
  });
  const [completeFormData, setCompleteFormData] = useState({
    finalPrice: 0,
  });
  const [dpFormData, setDpFormData] = useState({
    dpAmount: 0,
  });
  const [selectedSpareparts, setSelectedSpareparts] = useState<any[]>([]);
  const [newSparepart, setNewSparepart] = useState({
    variantId: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch products (needed for spareparts selection)
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data);
      }

      if (activeSubTab === 'catalog') {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success) {
          setServices(data.data);
        }
      } else {
        const res = await fetch('/api/service-orders');
        const data = await res.json();
        if (data.success) {
          setServiceOrders(data.data);
        }
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
    const method = editingService ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Jasa ${editingService ? 'diedit' : 'ditambahkan'} berhasil`);
        setShowServiceModal(false);
        setEditingService(null);
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan jasa');
      }
    } catch (error) {
      console.error('Save service error:', error);
      alert('Gagal menyimpan jasa');
    }
  };

  const handleSubmitServiceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert dpAmount from string to number (empty string becomes 0)
      const formData = {
        ...orderFormData,
        dpAmount: orderFormData.dpAmount === '' ? 0 : Number(orderFormData.dpAmount),
      };

      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('Pesanan service berhasil dibuat');
        setShowServiceOrderModal(false);
        setOrderFormData({
          serviceId: '',
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          itemDescription: '',
          problemDescription: '',
          dpAmount: '',
          notes: '',
        });
        if (activeSubTab === 'orders') {
          fetchData();
        }
      } else {
        alert(data.error || 'Gagal membuat pesanan service');
      }
    } catch (error) {
      console.error('Create service order error:', error);
      alert('Gagal membuat pesanan service');
    }
  };

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Toggle service error:', error);
      alert('Gagal mengubah status jasa');
    }
  };

  const deleteService = async (serviceId: string) => {
    if (confirm('Yakin ingin menghapus jasa ini?')) {
      try {
        const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchData();
          alert('Jasa berhasil dihapus');
        }
      } catch (error) {
        console.error('Delete service error:', error);
        alert('Gagal menghapus jasa');
      }
    }
  };

  const updateServiceOrderStatus = async (orderId: string, action: string, data: any = {}) => {
    try {
      const res = await fetch(`/api/service-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const responseData = await res.json();
      if (responseData.success) {
        fetchData();
        alert(responseData.message || 'Berhasil');
      } else {
        alert(responseData.error || 'Gagal mengupdate pesanan');
      }
    } catch (error) {
      console.error('Update service order error:', error);
      alert('Gagal mengupdate pesanan');
    }
  };

  const handleRecordDP = async () => {
    if (!selectedServiceOrder) return;

    try {
      const res = await fetch(`/api/service-orders/${selectedServiceOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordDP',
          dpAmount: dpFormData.dpAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('DP berhasil dicatat');
        setShowDPModal(false);
        setDpFormData({ dpAmount: 0 });
        fetchData();
        // Update dashboard stats
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Gagal mencatat DP');
      }
    } catch (error) {
      console.error('Record DP error:', error);
      alert('Gagal mencatat DP');
    }
  };

  const handleCompleteService = async () => {
    if (!selectedServiceOrder) return;

    try {
      const res = await fetch(`/api/service-orders/${selectedServiceOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeService',
          finalPrice: completeFormData.finalPrice,
          spareparts: selectedSpareparts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Service selesai');
        setShowCompleteModal(false);
        setCompleteFormData({ finalPrice: 0 });
        setSelectedSpareparts([]);
        setSelectedServiceOrder(null);
        fetchData();
        // Update dashboard stats
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Gagal menyelesaikan service');
      }
    } catch (error) {
      console.error('Complete service error:', error);
      alert('Gagal menyelesaikan service');
    }
  };

  const handleAddSparepart = () => {
    if (!newSparepart.variantId || newSparepart.quantity <= 0) {
      alert('Pilih variant dan masukkan jumlah yang valid');
      return;
    }

    const product = products.find(p =>
      p.variants?.some(v => v.id === newSparepart.variantId)
    );
    const variant = product?.variants?.find(v => v.id === newSparepart.variantId);

    if (!variant) {
      alert('Variant tidak ditemukan');
      return;
    }

    if (variant.stock < newSparepart.quantity) {
      alert(`Stok tidak cukup. Tersedia: ${variant.stock}, Diminta: ${newSparepart.quantity}`);
      return;
    }

    // Check if variant already in list
    const existingIndex = selectedSpareparts.findIndex(
      sp => sp.variantId === newSparepart.variantId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedSpareparts];
      updated[existingIndex].quantity += newSparepart.quantity;
      setSelectedSpareparts(updated);
    } else {
      // Add new sparepart
      setSelectedSpareparts([
        ...selectedSpareparts,
        {
          variantId: newSparepart.variantId,
          quantity: newSparepart.quantity,
          price: variant.price,
          variant,
          product,
        },
      ]);
    }

    setNewSparepart({ variantId: '', quantity: 1 });
  };

  const handleRemoveSparepart = (variantId: string) => {
    setSelectedSpareparts(selectedSpareparts.filter(sp => sp.variantId !== variantId));
  };

  const calculateSparepartsTotal = () => {
    return selectedSpareparts.reduce((sum, sp) => sum + (sp.price * sp.quantity), 0);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      duration: service.duration || '1 jam',
    });
    setShowServiceModal(true);
  };

  const categoryIcons: Record<string, string> = {
    elektronik: '💻',
    mekanik: '🔧',
    komputer: '💾',
    lainnya: '🔧',
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      in_progress: 'Dalam Pengerjaan',
      dp_paid: 'DP Dibayar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      dp_paid: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      unpaid: 'Belum Bayar',
      partial: 'Sebagian',
      paid: 'Lunas',
    };
    return labels[status] || status;
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      unpaid: 'badge-danger',
      partial: 'badge-warning',
      paid: 'badge-success',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Sub-tabs */}
        <div className="flex gap-2 mb-4 border-b border-[var(--border-color)] pb-4">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            📋 Katalog Jasa
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSubTab === 'orders'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            📝 Pesanan Service
          </button>
        </div>

        {/* Catalog Tab */}
        {activeSubTab === 'catalog' && (
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Katalog Jasa Service</h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setFormData({
                    name: '',
                    category: 'elektronik',
                    description: '',
                    price: 0,
                    duration: '1 jam',
                  });
                  setShowServiceModal(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Jasa Service
              </button>
            </div>
            {loading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : services.length > 0 ? (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Jasa</th>
                      <th>Kategori</th>
                      <th>Harga Estimasi</th>
                      <th>Durasi</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.filter(s => s.status !== 'deleted').map((service) => (
                      <tr key={service.id}>
                        <td>
                          <div>
                            <div className="font-medium">{service.name || '-'}</div>
                            <div className="text-xs text-[var(--text-muted)]">{service.description || ''}</div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm">
                            {categoryIcons[service.category] || '🔧'} {service.category || '-'}
                          </span>
                        </td>
                        <td className="font-semibold">{formatCurrency(service.price || 0)}</td>
                        <td className="text-sm">{service.duration || '-'}</td>
                        <td>
                          <span className={`badge ${service.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {service.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(service)}
                              className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleServiceStatus(service.id)}
                              className="px-3 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            >
                              {service.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-muted)]">Belum ada jasa service</div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeSubTab === 'orders' && (
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">Pesanan Service</h3>
                <button
                  onClick={() => setShowServiceOrderModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Buat Pesanan Service
                </button>
              </div>
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setServiceTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    serviceTypeFilter === 'all'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-white/10'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setServiceTypeFilter('toko')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    serviceTypeFilter === 'toko'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-white/10'
                  }`}
                >
                  🏪 Service Toko
                </button>
                <button
                  onClick={() => setServiceTypeFilter('panggilan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    serviceTypeFilter === 'panggilan'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-white/10'
                  }`}
                >
                  🏠 Service Panggilan
                </button>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : serviceOrders.filter(order => {
              if (serviceTypeFilter === 'all') return true;
              return order.serviceType === serviceTypeFilter;
            }).length > 0 ? (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipe</th>
                      <th>No. Pesanan</th>
                      <th>Pelanggan</th>
                      <th>Barang</th>
                      <th>Jasa Service</th>
                      <th>DP</th>
                      <th>Biaya Jasa</th>
                      <th>Sparepart</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceOrders
                      .filter(order => {
                        if (serviceTypeFilter === 'all') return true;
                        return order.serviceType === serviceTypeFilter;
                      })
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((order) => {
                        const hasSpareparts = order.spareparts && order.spareparts.length > 0;
                        const sparepartsTotal = hasSpareparts
                          ? order.spareparts.reduce((sum: number, sp: any) => sum + (sp.price * sp.quantity), 0)
                          : 0;
                        const totalBill = order.finalPrice + sparepartsTotal;
                        const isHomeService = order.serviceType === 'panggilan';

                        return (
                          <tr key={order.id}>
                            <td>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isHomeService ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {isHomeService ? '🏠 Panggilan' : '🏪 Toko'}
                              </span>
                            </td>
                            <td className="font-mono font-medium">{order.orderNumber}</td>
                            <td>
                              <div>
                                <div className="font-medium">{order.customerName || '-'}</div>
                                <div className="text-xs text-[var(--text-muted)]">{order.customerPhone || ''}</div>
                              </div>
                            </td>
                            <td>
                              <div className="text-sm max-w-[200px] truncate" title={order.itemDescription}>
                                {order.itemDescription || '-'}
                              </div>
                            </td>
                            <td>{order.service?.name || '-'}</td>
                            <td className="font-semibold text-yellow-400">
                              {order.dpAmount > 0 ? formatCurrency(order.dpAmount) : '-'}
                            </td>
                            <td className="font-semibold text-green-400">
                              {order.finalPrice > 0 ? formatCurrency(order.finalPrice) : '-'}
                            </td>
                            <td className="font-semibold text-blue-400">
                              {hasSpareparts ? formatCurrency(sparepartsTotal) : '-'}
                            </td>
                            <td className="font-bold text-purple-400">
                              {totalBill > 0 ? formatCurrency(totalBill) : '-'}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2 flex-wrap">
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => updateServiceOrderStatus(order.id, 'updateStatus', { status: 'in_progress' })}
                                    className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                  >
                                    Mulai
                                  </button>
                                )}
                                {order.status === 'in_progress' && (
                                  <button
                                    onClick={() => {
                                      setSelectedServiceOrder(order);
                                      setShowDPModal(true);
                                    }}
                                    className="px-3 py-1 text-xs rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                  >
                                    Catat DP
                                  </button>
                                )}
                                {(order.status === 'in_progress' || order.status === 'dp_paid') && (
                                  <button
                                    onClick={() => {
                                      setSelectedServiceOrder(order);
                                      setCompleteFormData({ finalPrice: order.estimatedPrice || 0 });
                                      setSelectedSpareparts([]);
                                      setShowCompleteModal(true);
                                    }}
                                    className="px-3 py-1 text-xs rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                  >
                                    Selesai
                                </button>
                              )}
                              {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Alasan pembatalan:');
                                    if (reason) {
                                      updateServiceOrderStatus(order.id, 'updateStatus', { status: 'cancelled', cancelReason: reason });
                                    }
                                  }}
                                  className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                  Batal
                                </button>
                              )}
                                <button
                                  onClick={() => setPrintServiceOrder(order)}
                                  className="px-3 py-1 text-xs rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                  title="Cetak Struk"
                                >
                                  <Printer className="w-3 h-3" />
                                </button>
                              </div>
                          </td>
                        </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-muted)]">Belum ada pesanan service</div>
            )}
          </div>
        )}
      </div>

      {/* Service Catalog Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">
                {editingService ? 'Edit Jasa Service' : 'Tambah Jasa Service'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nama Jasa</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Service AC"
                  className="input-field"
                  minLength={3}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Kategori</label>
                <select
                  name="category"
                  required
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Pilih Kategori</option>
                  <option value="elektronik">Elektronik</option>
                  <option value="mekanik">Mekanik</option>
                  <option value="komputer">Komputer</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Deskripsi</label>
                <textarea
                  name="description"
                  required
                  placeholder="Deskripsi jasa service"
                  className="input-field resize-none"
                  rows={3}
                  minLength={10}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Harga Estimasi (Rp)</label>
                <input
                  type="number"
                  name="price"
                  required
                  placeholder="0"
                  className="input-field"
                  min={0}
                  step={1000}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Ini hanya estimasi, harga final ditentukan saat pekerjaan selesai</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Durasi Estimasi</label>
                <select
                  name="duration"
                  required
                  className="input-field"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                >
                  <option value="">Pilih Durasi</option>
                  <option value="1 jam">1 jam</option>
                  <option value="2 jam">2 jam</option>
                  <option value="3 jam">3 jam</option>
                  <option value="4 jam">4 jam</option>
                  <option value="1 hari">1 hari</option>
                  <option value="2 hari">2 hari</option>
                  <option value="3 hari">3 hari</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Simpan Jasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Order Modal */}
      {showServiceOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Buat Pesanan Service</h3>
              <button onClick={() => setShowServiceOrderModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitServiceOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Pilih Jasa Service *</label>
                <select
                  required
                  className="input-field"
                  value={orderFormData.serviceId}
                  onChange={(e) => setOrderFormData({ ...orderFormData, serviceId: e.target.value })}
                >
                  <option value="">-- Pilih Jasa --</option>
                  {services.filter(s => s.status === 'active').map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price)} (Estimasi)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    className="input-field"
                    value={orderFormData.customerName}
                    onChange={(e) => setOrderFormData({ ...orderFormData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">No. WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="08xxxxxxxxxx"
                    className="input-field"
                    value={orderFormData.customerPhone}
                    onChange={(e) => setOrderFormData({ ...orderFormData, customerPhone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Alamat Pelanggan *</label>
                <textarea
                  required
                  placeholder="Alamat lengkap"
                  className="input-field resize-none"
                  rows={2}
                  value={orderFormData.customerAddress}
                  onChange={(e) => setOrderFormData({ ...orderFormData, customerAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Deskripsi Barang yang Diservis *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laptop Lenovo ThinkPad T480"
                  className="input-field"
                  value={orderFormData.itemDescription}
                  onChange={(e) => setOrderFormData({ ...orderFormData, itemDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Keluhan / Masalah</label>
                <textarea
                  placeholder="Jelaskan masalah barang"
                  className="input-field resize-none"
                  rows={2}
                  value={orderFormData.problemDescription}
                  onChange={(e) => setOrderFormData({ ...orderFormData, problemDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Uang Muka / DP (Rp)</label>
                <input
                  type="number"
                  placeholder=""
                  className="input-field"
                  min={0}
                  step={1000}
                  value={orderFormData.dpAmount}
                  onChange={(e) => setOrderFormData({ ...orderFormData, dpAmount: e.target.value })}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">DP bersifat opsional. Harga final ditentukan saat pekerjaan selesai</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Catatan</label>
                <textarea
                  placeholder="Catatan tambahan"
                  className="input-field resize-none"
                  rows={2}
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceOrderModal(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Buat Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DP Modal */}
      {showDPModal && selectedServiceOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Catat DP</h3>
              <button onClick={() => setShowDPModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--bg-elevated)]">
                <p className="text-sm text-[var(--text-muted)]">Estimasi Harga (saat pesanan dibuat)</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedServiceOrder.estimatedPrice)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  DP akan dikurangi dari total harga saat pekerjaan selesai
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Jumlah DP (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan jumlah DP"
                  className="input-field"
                  min={1000}
                  step={1000}
                  value={dpFormData.dpAmount}
                  onChange={(e) => setDpFormData({ dpAmount: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDPModal(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleRecordDP}
                  disabled={dpFormData.dpAmount <= 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan DP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Service Modal */}
      {showCompleteModal && selectedServiceOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full p-6 my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Selesaikan Service</h3>
              <button onClick={() => setShowCompleteModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Info Section */}
              <div className="p-4 rounded-lg bg-[var(--bg-elevated)] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Estimasi Harga (saat pesanan dibuat)</span>
                  <span className="font-medium">{formatCurrency(selectedServiceOrder.estimatedPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">DP yang sudah dibayar</span>
                  <span className="font-bold text-yellow-400">{formatCurrency(selectedServiceOrder.dpAmount)}</span>
                </div>
              </div>

              {/* Service Price */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Harga Final Jasa Service (Rp) *
                  <span className="text-xs text-purple-400 ml-2">✓ Bisa diubah sesuai biaya real</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan harga final sesuai biaya real"
                  className="input-field"
                  min={0}
                  step={1000}
                  value={completeFormData.finalPrice}
                  onChange={(e) => setCompleteFormData({ finalPrice: Number(e.target.value) })}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Biaya jasa service (tanpa sparepart)
                </p>
              </div>

              {/* Spareparts Section */}
              <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Sparepart yang Digunakan (Opsional)
                </h4>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Tambahkan sparepart yang diambil dari stok toko. Stok akan otomatis berkurang.
                </p>

                {/* Add Sparepart Form */}
                <div className="flex gap-2 mb-3">
                  <select
                    className="input-field flex-1"
                    value={newSparepart.variantId}
                    onChange={(e) => setNewSparepart({ ...newSparepart, variantId: e.target.value })}
                  >
                    <option value="">-- Pilih Sparepart --</option>
                    {products
                      .filter(p => p.isActive && p.variants && p.variants.length > 0)
                      .map(product =>
                        product.variants?.filter(v => v.stock > 0).map(variant => (
                          <option key={variant.id} value={variant.id}>
                            {product.name} - {variant.variantName} ({formatCurrency(variant.price)}) - Stok: {variant.stock}
                          </option>
                        ))
                      )
                    }
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="input-field w-24"
                    placeholder="Jml"
                    value={newSparepart.quantity}
                    onChange={(e) => setNewSparepart({ ...newSparepart, quantity: Number(e.target.value) })}
                  />
                  <button
                    onClick={handleAddSparepart}
                    disabled={!newSparepart.variantId || newSparepart.quantity <= 0}
                    className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Spareparts List */}
                {selectedSpareparts.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSpareparts.map((sp, idx) => (
                      <div key={sp.variantId} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{sp.product?.name} - {sp.variant?.variantName}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {sp.quantity} x {formatCurrency(sp.price)} = {formatCurrency(sp.price * sp.quantity)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveSparepart(sp.variantId)}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Section */}
              {(completeFormData.finalPrice > 0 || selectedSpareparts.length > 0) && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Ringkasan Pembayaran</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Biaya Jasa Service</span>
                    <span className="font-bold text-green-400">
                      {formatCurrency(completeFormData.finalPrice)}
                    </span>
                  </div>
                  {selectedSpareparts.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Biaya Spareparts</span>
                      <span className="font-bold text-blue-400">
                        {formatCurrency(calculateSparepartsTotal())}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">Dikurangi DP</span>
                    <span className="font-medium text-yellow-400">- {formatCurrency(selectedServiceOrder.dpAmount)}</span>
                  </div>
                  <div className="border-t border-green-500/30 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Total Tagihan:</span>
                      <span className="font-bold text-xl text-green-400">
                        {formatCurrency(completeFormData.finalPrice + calculateSparepartsTotal())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-semibold text-sm">Sisa pembayaran:</span>
                      <span className="font-bold text-lg text-yellow-400">
                        {formatCurrency(Math.max(0, completeFormData.finalPrice + calculateSparepartsTotal() - selectedServiceOrder.dpAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedSpareparts([]);
                  }}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleCompleteService}
                  disabled={completeFormData.finalPrice <= 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selesaikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Service Receipt */}
      {printServiceOrder && (
        <PrintServiceReceipt
          serviceOrder={printServiceOrder}
          onClose={() => setPrintServiceOrder(null)}
        />
      )}
    </>
  );
}
