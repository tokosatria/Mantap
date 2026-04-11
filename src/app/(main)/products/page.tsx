'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import BottomNavigation from '@/components/BottomNavigation';
import SkeletonCard from '@/components/SkeletonCard';
import { Product, Category } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    fetchData();
    fetchUserData();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();
    const handleOrderUpdate = () => fetchPendingOrderCount();

    window.addEventListener('cartUpdate', handleCartUpdate);
    window.addEventListener('orderUpdate', handleOrderUpdate);
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
      window.removeEventListener('orderUpdate', handleOrderUpdate);
    };
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentUser(data.data);
        fetchCartCount();
        fetchPendingOrderCount();
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    }
  };

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesRes = await fetch('/api/categories');
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }

      // Fetch products
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('isActive', 'true');

      const productsRes = await fetch(`/api/products?${params.toString()}`);
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (variantId: string, quantity: number) => {
    // Cart update logic will be handled by the modal
    console.log('Added to cart:', { variantId, quantity });
  };

  return (
    <>
      {/* Background Effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <main className="pt-20 md:pt-24 min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
              Semua Produk
            </h1>
            <p className="text-[var(--text-secondary)]">
              Temukan produk terbaik untuk kebutuhan Anda
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <SlidersHorizontal className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={`category-tab whitespace-nowrap ${
                  selectedCategory === null ? 'active' : ''
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-tab whitespace-nowrap ${
                    selectedCategory === cat.id ? 'active' : ''
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                <Search className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tidak ada produk ditemukan</h3>
              <p className="text-[var(--text-muted)]">
                Coba ubah filter atau kata pencarian
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        cartCount={cartCount}
        pendingOrderCount={pendingOrderCount}
        currentUser={currentUser}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
