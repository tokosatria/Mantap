'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, QrCode, CheckCircle, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface QrisImage {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function QrisTab() {
  const [qrisImages, setQrisImages] = useState<QrisImage[]>([]);
  const [activeQris, setActiveQris] = useState<QrisImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQrisImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/qris/list');
      const data = await res.json();
      if (data.success) {
        setQrisImages(data.data);
        // Set active QRIS
        const active = data.data.find((q: QrisImage) => q.isActive);
        setActiveQris(active || null);
      }
    } catch (error) {
      console.error('Fetch QRIS error:', error);
      alert('Gagal memuat QRIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrisImages();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    const name = (document.getElementById('qris-name') as HTMLInputElement)?.value;
    const description = (document.getElementById('qris-description') as HTMLInputElement)?.value;

    if (!file) {
      alert('Pilih gambar QRIS terlebih dahulu');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || 'QRIS Dana');
      formData.append('description', description || '');

      const res = await fetch('/api/admin/qris/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert('QRIS berhasil diupload!');
        setShowUploadModal(false);
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchQrisImages();
      } else {
        alert(data.error || 'Gagal upload QRIS');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gagal upload QRIS');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (qrisId: string) => {
    if (!confirm('Aktifkan QRIS ini? QRIS yang aktif saat ini akan dinonaktifkan.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/qris/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrisId }),
      });

      const data = await res.json();

      if (data.success) {
        alert('QRIS berhasil diaktifkan!');
        fetchQrisImages();
      } else {
        alert(data.error || 'Gagal mengaktifkan QRIS');
      }
    } catch (error) {
      console.error('Activate error:', error);
      alert('Gagal mengaktifkan QRIS');
    }
  };

  const handleDelete = async (qrisId: string) => {
    if (!confirm('Hapus QRIS ini? Tindakan tidak dapat dibatalkan.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/qris/delete?qrisId=${qrisId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('QRIS berhasil dihapus!');
        fetchQrisImages();
      } else {
        alert(data.error || 'Gagal menghapus QRIS');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Gagal menghapus QRIS');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload QRIS Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Upload QRIS
          </h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload QRIS Baru
          </button>
        </div>

        {/* Active QRIS Preview */}
        {activeQris && (
          <div className="mt-6 p-6 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-500 mb-1">QRIS Aktif</div>
                <div className="font-bold">{activeQris.name}</div>
                {activeQris.description && (
                  <div className="text-sm text-[var(--text-secondary)]">{activeQris.description}</div>
                )}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <img
                src={activeQris.imageUrl}
                alt={activeQris.name}
                className="w-48 h-48 object-contain border border-[var(--border-color)] rounded-lg bg-white"
              />
            </div>
            <div className="text-center text-sm text-[var(--text-muted)] mt-2">
              Upload pada: {formatDate(activeQris.createdAt)}
            </div>
          </div>
        )}

        {!activeQris && (
          <div className="mt-6 text-center p-8 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
            <QrCode className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)]">
              Belum ada QRIS yang aktif. Upload QRIS untuk ditampilkan di struk.
            </p>
          </div>
        )}
      </div>

      {/* QRIS List */}
      <div className="card">
        <div className="p-6 border-b border-[var(--border-color)]">
          <h3 className="font-display font-bold text-lg">Daftar QRIS</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : qrisImages.length > 0 ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrisImages.map((qris) => (
              <div
                key={qris.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  qris.isActive
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {qris.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-500 mb-1">
                        <CheckCircle className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                    <div className="font-semibold truncate">{qris.name}</div>
                    {qris.description && (
                      <div className="text-sm text-[var(--text-secondary)] truncate">
                        {qris.description}
                      </div>
                    )}
                  </div>
                  {!qris.isActive && (
                    <button
                      onClick={() => handleActivate(qris.id)}
                      className="ml-2 px-2 py-1 text-xs rounded bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors flex-shrink-0"
                      title="Aktifkan"
                    >
                      Aktifkan
                    </button>
                  )}
                </div>
                <div className="flex justify-center mb-2">
                  <img
                    src={qris.imageUrl}
                    alt={qris.name}
                    className="w-32 h-32 object-contain border border-[var(--border-color)] rounded-lg bg-white"
                  />
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {formatDate(qris.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)]">
            Belum ada QRIS yang diupload
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full my-4 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute -top-3 -right-3 z-[10000] w-12 h-12 rounded-full bg-red-500 border-2 border-red-600 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 shadow-xl transition-all duration-200"
              title="Tutup"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6 border-b border-[var(--border-color)] flex-shrink-0">
              <h3 className="font-display font-bold text-xl">Upload QRIS Baru</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Pilih Gambar QRIS
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="input-field"
                />
              </div>

              {/* Preview */}
              {previewImage && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm font-medium">Preview:</div>
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-48 h-48 object-contain border border-[var(--border-color)] rounded-lg bg-white"
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Nama QRIS
                </label>
                <input
                  type="text"
                  id="qris-name"
                  placeholder="Contoh: QRIS Dana"
                  className="input-field"
                  defaultValue="QRIS Dana"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="qris-description"
                  placeholder="Contoh: QRIS untuk pembayaran via Dana"
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 p-6 border-t border-[var(--border-color)] flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                className="btn-primary flex-1"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
