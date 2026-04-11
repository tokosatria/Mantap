'use client';

import { ShoppingBag, Star, Flame } from 'lucide-react';
import { Product } from '@/types/index';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  // Calculate price range
  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map((v) => v.harga));
    }
    return product.harga;
  };

  const getMaxPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.max(...product.variants.map((v) => v.harga));
    }
    return product.harga;
  };

  const minPrice = getMinPrice();
  const maxPrice = getMaxPrice();
  const hasVariants = product.variants && product.variants.length > 0;

  // Social elements (for demo - will be replaced with real data from DB)
  const rating = (4.5 + Math.random() * 0.5).toFixed(1); // 4.5 - 5.0
  const soldCount = Math.floor(Math.random() * 1000) + 10; // 10 - 1010
  const soldDisplay = soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}rb` : soldCount;

  // Check for discount (promo badge)
  const hasDiscount = hasVariants && minPrice < product.harga;
  const discountPercentage = hasDiscount
    ? Math.round(((product.harga - minPrice) / product.harga) * 100)
    : 0;

  return (
    <div
      className="card cursor-pointer group flex flex-col h-full"
      onClick={onClick}
    >
      {/* Product Image Section */}
      <div className="overflow-hidden relative flex-shrink-0">
        <img
          src={product.gambar}
          alt={product.nama}
          className="product-image w-full"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="#1e1e1e" width="300" height="300"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14">No Image</text></svg>'
            );
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && discountPercentage > 0 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {discountPercentage}%
            </div>
          )}
        </div>

        {hasVariants && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
            {product.variants!.length} Varian
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-medium text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors leading-tight min-h-[40px] sm:min-h-[48px]">
          {product.nama}
        </h3>

        {/* Social Elements - Rating & Sold */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs sm:text-sm font-semibold text-yellow-400">{rating}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
            Terjual {soldDisplay}
          </span>
        </div>

        {/* Price Section */}
        <div className="mt-auto">
          {hasVariants && minPrice !== maxPrice ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">Mulai dari</span>
              <span className="price-main text-base sm:text-lg font-bold">
                {formatCurrency(minPrice)}
              </span>
              {hasDiscount && discountPercentage > 0 && (
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] line-through">
                  {formatCurrency(product.harga)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="price-main text-base sm:text-lg font-bold">
                  {formatCurrency(minPrice)}
                </span>
                {hasDiscount && discountPercentage > 0 && (
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] line-through">
                    {formatCurrency(product.harga)}
                  </span>
                )}
              </div>
              <button
                className="btn-primary p-2 sm:p-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Add to cart button for variant products */}
          {hasVariants && minPrice !== maxPrice && (
            <button
              className="btn-primary w-full mt-2 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Lihat Varian
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
