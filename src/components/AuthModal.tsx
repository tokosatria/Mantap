'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      noWhatsapp: formData.get('noWhatsapp') as string,
      password: formData.get('password') as string,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        onAuthSuccess?.(result.data);
        onClose();
      } else {
        setError(result.message || result.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      nama: formData.get('nama') as string,
      noKtp: formData.get('noKtp') as string,
      noWhatsapp: formData.get('noWhatsapp') as string,
      alamat: formData.get('alamat') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        onAuthSuccess?.(result.data);
        onClose();
      } else {
        setError(result.message || result.error || 'Registrasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-2xl gradient-text">
              {isLogin ? 'Masuk Akun' : 'Daftar Akun'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-(--bg-elevated)] p-1 rounded-xl">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-(--accent-primary)] text-white'
                  : 'text-(--text-secondary) hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-(--accent-primary)] text-white'
                  : 'text-(--text-secondary) hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="noWhatsapp"
                  required
                  placeholder="08xxxxxxxxxx"
                  className="input-field"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Masukkan password"
                  className="input-field"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Nama Lengkap / Perusahaan
                </label>
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
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Nomor KTP / NPWP
                </label>
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
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="noWhatsapp"
                  required
                  placeholder="08xxxxxxxxxx"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                  Alamat Lengkap
                </label>
                <textarea
                  name="alamat"
                  required
                  placeholder="Jl. Nama Jalan No.xx, Kota, Provinsi"
                  className="input-field resize-none"
                  rows={3}
                  minLength={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Min. 6 karakter"
                    className="input-field"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-(--text-secondary)">
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Ulangi password"
                    className="input-field"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
