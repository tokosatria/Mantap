'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Wrench } from 'lucide-react';

interface ServiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceCallModal({ isOpen, onClose }: ServiceCallModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    itemDescription: '',
    problemDescription: '',
    preferredDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Handle browser back button
  useEffect(() => {
    if (isOpen) {
      // Push a new history entry when modal opens
      window.history.pushState({ modal: true }, '');

      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal) {
          onClose();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // Fungsi untuk mengkonversi nomor WhatsApp
  const formatWhatsAppNumber = (value: string) => {
    // Hapus semua karakter non-angka
    let cleaned = value.replace(/\D/g, '');

    // Jika dimulai dengan '0', ganti dengan '62'
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }

    return cleaned;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsAppNumber(e.target.value);
    setFormData({ ...formData, customerPhone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ ' + data.message);
        setFormData({
          customerName: '',
          customerPhone: '',
          itemDescription: '',
          problemDescription: '',
          preferredDate: '',
          notes: '',
        });
        // Close modal and redirect to home
        onClose();
        window.location.href = '/';
      } else {
        alert('❌ ' + (data.error || 'Gagal mengirim permintaan'));
      }
    } catch (error) {
      alert('❌ Terjadi kesalahan saat mengirim permintaan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-24 overflow-y-auto safe-area-top"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full my-4 mt-safe flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">Service Panggilan</h3>
                <p className="text-sm text-[var(--text-muted)]">Kami datang ke lokasi Anda</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Pelanggan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* No HP */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Nomor WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={formData.customerPhone}
                onChange={handleWhatsAppChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Nama Barang */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Nama Barang yang akan di Service <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: TV LED 32 inch Samsung"
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Keluhan/Kerusakan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Keluhan / Kerusakan <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan masalah yang terjadi pada barang..."
                value={formData.problemDescription}
                onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                className="input-field resize-none"
                disabled={loading}
              />
            </div>

            {/* Waktu Kunjungan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Waktu yang Diinginkan untuk Kunjungan
              </label>
              <input
                type="text"
                placeholder="Contoh: Besok siang jam 10 atau Minggu pagi"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Kami akan berusaha mengatur kunjungan sesuai waktu yang Anda inginkan
              </p>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Informasi tambahan yang perlu kami ketahui..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field resize-none"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Kirim Permintaan'}
              </button>
            </div>
          </form>

          {/* Info Banner */}
          <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-cyan-400 text-sm">Layanan Home Service</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Tim kami akan menghubungi Anda untuk konfirmasi dan estimasi biaya sebelum melakukan kunjungan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
