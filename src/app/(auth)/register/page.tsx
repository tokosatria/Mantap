'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight, IdCard } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    noKtp: '',
    noWhatsapp: '',
    alamat: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setFormData({ ...formData, noWhatsapp: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: formData.nama,
          noKtp: formData.noKtp,
          noWhatsapp: formData.noWhatsapp,
          alamat: formData.alamat,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/login');
      } else {
        setError(data.message || 'Registrasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">Buat Akun Baru</h1>
          <p className="text-(--text-secondary)">
            Bergabunglah dengan Satria Elektronik sekarang
          </p>
        </div>

        {/* Register Form */}
        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label htmlFor="nama" className="block text-sm font-semibold mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.nama ? '0' : '1' }} />
                <input
                  id="nama"
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="input-field transition-all duration-200"
                  style={{ paddingLeft: formData.nama ? '1rem' : '2.75rem' }}
                  required
                />
              </div>
            </div>

            {/* No KTP */}
            <div>
              <label htmlFor="noKtp" className="block text-sm font-semibold mb-2">
                No. KTP/NPWP
              </label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.noKtp ? '0' : '1' }} />
                <input
                  id="noKtp"
                  type="text"
                  value={formData.noKtp}
                  onChange={(e) => setFormData({ ...formData, noKtp: e.target.value })}
                  className="input-field transition-all duration-200"
                  style={{ paddingLeft: formData.noKtp ? '1rem' : '2.75rem' }}
                  required
                />
              </div>
            </div>

            {/* No WhatsApp */}
            <div>
              <label htmlFor="noWhatsapp" className="block text-sm font-semibold mb-2">
                No. WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.noWhatsapp ? '0' : '1' }} />
                <input
                  id="noWhatsapp"
                  type="tel"
                  value={formData.noWhatsapp}
                  onChange={handleWhatsAppChange}
                  className="input-field transition-all duration-200"
                  style={{ paddingLeft: formData.noWhatsapp ? '1rem' : '2.75rem' }}
                  required
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="alamat" className="block text-sm font-semibold mb-2">
                Alamat Lengkap
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.alamat ? '0' : '1' }} />
                <textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  rows={3}
                  className="input-field resize-none transition-all duration-200"
                  style={{ paddingLeft: formData.alamat ? '1rem' : '2.75rem' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.password ? '0' : '1' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field transition-all duration-200"
                  style={{ paddingLeft: formData.password ? '1rem' : '2.75rem', paddingRight: '3rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted) pointer-events-none transition-opacity duration-200" style={{ opacity: formData.confirmPassword ? '0' : '1' }} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field transition-all duration-200"
                  style={{ paddingLeft: formData.confirmPassword ? '1rem' : '2.75rem', paddingRight: '3rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Daftar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--border-color)" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-(--bg-card) text-(--text-muted)">
                atau
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-(--text-secondary)">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="text-(--accent-primary) font-semibold hover:underline"
              >
                Masuk sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
