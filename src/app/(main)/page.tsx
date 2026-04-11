'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import BottomNavigation from '@/components/BottomNavigation';
import SkeletonCard from '@/components/SkeletonCard';
import { Product, Category } from '@/types/index';
import { Package } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    fetchData();
    fetchUserData();
  }, [selectedCategory]);

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

      // Fetch featured products (limit to 6)
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      if (selectedCategory) params.append('categoryId', selectedCategory);

      const productsRes = await fetch(`/api/products?${params.toString()}`);
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (variantId: string, quantity: number) => {
    // Cart update will be handled
    console.log('Added to cart:', { variantId, quantity });
    // Show toast notification here
  };

  return (
    <>
      {/* Background Effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-12 pb-20 md:pb-12">
        {/* Categories */}
        <div className="mb-10 md:mb-12">
          <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-white">
            Kategori Produk
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`category-tab text-sm sm:text-base ${
                selectedCategory === null ? 'active' : ''
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-tab text-sm sm:text-base ${
                  selectedCategory === cat.id ? 'active' : ''
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-white">
              {selectedCategory ? 'Produk Terkait' : 'Produk Unggulan'}
            </h2>
            <a
              href="/products"
              className="text-[var(--accent-primary)] hover:underline text-sm sm:text-base font-medium"
            >
              Lihat Semua →
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <p className="text-[var(--text-muted)] text-sm sm:text-base">
                Tidak ada produk di kategori ini
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-sm sm:text-base">Satria Elektronik</span>
            </div>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm">
              © 2024 Satria Elektronik. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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
