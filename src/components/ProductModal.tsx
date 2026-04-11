'use client';

import { useState } from 'react';
import { X, ShoppingBag, Minus, Plus, Package } from 'lucide-react';
import { Product, Variant } from '@/types/index';
import { formatCurrency } from '@/lib/utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart?: (variantId: string, quantity: number) => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (!isOpen || !product) return null;

  const variants = product.variants || [];

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (
      newQuantity >= 1 &&
      (!selectedVariant || newQuantity <= selectedVariant.stock)
    ) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setAdding(true);
    try {
      // Cek apakah user sudah login
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok || authRes.status === 401) {
        // User belum login, redirect ke halaman register
        window.location.href = '/register';
        return;
      }

      // User sudah login, lanjut tambah ke keranjang
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity,
        }),
      });

      if (res.ok) {
        // Dispatch event to update cart count in header
        window.dispatchEvent(new Event('cartUpdate'));
      }

      onAddToCart?.(selectedVariant.id, quantity);
      onClose();
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setAdding(false);
    }
  };

  const currentPrice = selectedVariant?.harga || product.harga;
  const currentStock = selectedVariant?.stok || 0;
  const inStock = currentStock > 0;

  // Get price range for display
  const getPriceRange = () => {
    if (variants.length === 0) return { min: product.harga, max: product.harga };
    const prices = variants.map(v => v.harga);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const priceRange = getPriceRange();
  const showPriceRange = variants.length > 0 && priceRange.min !== priceRange.max && !selectedVariant;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Product Content */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="relative aspect-square md:aspect-auto">
              <img
                src={product.gambar}
                alt={product.nama}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Details */}
            <div className="p-6 md:p-8">
              <span className="text-xs text-(--accent-primary) font-medium uppercase tracking-wide">
                {product.category?.nama}
              </span>
              <h2 className="font-display font-bold text-2xl mt-2 mb-3">
                {product.nama}
              </h2>
              <p className="text-(--text-secondary) text-sm mb-6">
                {product.deskripsi}
              </p>

              {/* Price */}
              <div className="mb-6">
                <p className="text-(--text-muted) text-sm mb-1">Harga</p>
                {showPriceRange ? (
                  <div>
                    <span className="text-(--text-muted) text-xs">Mulai dari </span>
                    <span className="price-main text-xl">{formatCurrency(priceRange.min)}</span>
                  </div>
                ) : (
                  <p className="price-main">{formatCurrency(currentPrice)}</p>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <p className="text-(--text-muted) text-sm mb-3">Pilih Varian</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        disabled={variant.stok === 0}
                        className={`variant-option w-full text-left flex justify-between items-center ${
                          selectedVariant?.id === variant.id ? 'selected' : ''
                        } ${variant.stok === 0 ? 'disabled' : ''}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{variant.nama}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(variant.harga)}</p>
                          <p className="text-xs text-(--text-muted)">
                            {variant.stok > 0 ? `Stok: ${variant.stok}` : 'Habis'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {selectedVariant && (
                <div className="mb-6">
                  <p className="text-(--text-muted) text-sm mb-3">Jumlah</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="qty-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= currentStock}
                        className="qty-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-(--text-muted)">
                      Total: {formatCurrency(currentPrice * quantity)}
                    </span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || !inStock || adding}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Memproses...' : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {inStock ? 'Tambah ke Keranjang' : 'Stok Habis'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
