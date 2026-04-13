'use client';

import { useEffect } from 'react';
import { WifiOff, RefreshCw, Package, ArrowRight } from 'lucide-react';

export default function OfflinePage() {
  useEffect(() => {
    // Auto reload when connection is restored
    const handleOnline = () => {
      window.location.href = '/';
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center shadow-2xl">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/30 flex items-center justify-center mb-6">
            <WifiOff className="w-12 h-12 text-cyan-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Tidak Ada Koneksi Internet
          </h1>

          {/* Description */}
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            Sepertinya Anda sedang offline. Pastikan koneksi internet Anda aktif
            lalu coba lagi untuk mengakses Satria Elektronik.
          </p>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="w-full btn-primary bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mb-4"
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>

          {/* Offline Features */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Saat offline, beberapa fitur tidak tersedia:
            </p>

            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-3 h-3 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Katalog Produk</p>
                  <p className="text-xs text-[var(--text-muted)]">Tidak dapat memuat produk terbaru</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Service Panggilan</p>
                  <p className="text-xs text-[var(--text-muted)]">Tidak dapat mengirim request service</p>
                </div>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-[var(--text-primary)]">Satria Elektronik</p>
                <p className="text-xs text-[var(--text-muted)]">Toko Elektronik Terpercaya</p>
              </div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Halaman ini akan otomatis reload saat koneksi internet kembali
        </p>
      </div>
    </div>
  );
}
