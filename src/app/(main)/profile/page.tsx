'use client';

import { useState, useEffect } from 'react';
import { User, Lock, MapPin, Phone, IdCard, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data diri
  const [profileData, setProfileData] = useState({
    nama: '',
    noKtp: '',
    noWhatsapp: '',
    alamat: '',
  });

  // Form ganti password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success && data.data) {
        setCurrentUser(data.data);
        setProfileData({
          nama: data.data.nama || '',
          noKtp: data.data.noKtp || '',
          noWhatsapp: data.data.noWhatsapp || '',
          alamat: data.data.alamat || '',
        });
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('✅ Data diri berhasil diperbarui!');
        setCurrentUser({ ...currentUser, ...profileData });
      } else {
        setErrorMessage('❌ ' + (data.message || 'Gagal memperbarui data'));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setErrorMessage('❌ Terjadi kesalahan saat memperbarui data');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    // Validasi password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('❌ Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('❌ Password baru minimal 6 karakter');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('✅ Password berhasil diubah!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setErrorMessage('❌ ' + (data.message || 'Gagal mengubah password'));
      }
    } catch (error) {
      console.error('Change password error:', error);
      setErrorMessage('❌ Terjadi kesalahan saat mengubah password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-24 safe-area-top">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl mb-2">Profil Saya</h1>
          <p className="text-[var(--text-secondary)]">
            Kelola informasi akun dan keamanan
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Profile Info Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{currentUser?.nama}</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {currentUser?.role === 'admin' ? 'Admin' : 'Agen'}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">No. KTP</span>
              <span className="font-medium">{currentUser?.noKtp}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">No. WhatsApp</span>
              <span className="font-medium">{currentUser?.noWhatsapp}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-muted)]">Alamat</span>
              <span className="font-medium text-right max-w-[60%]">
                {currentUser?.alamat}
              </span>
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="card p-6 mb-6">
          <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--accent-primary)]" />
            Perbaiki Data Diri
          </h3>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Nama */}
            <div>
              <label htmlFor="nama" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="nama"
                  type="text"
                  value={profileData.nama}
                  onChange={(e) => setProfileData({ ...profileData, nama: e.target.value })}
                  className="input-field pl-12"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* No KTP */}
            <div>
              <label htmlFor="noKtp" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                No. KTP <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="noKtp"
                  type="text"
                  value={profileData.noKtp}
                  onChange={(e) => setProfileData({ ...profileData, noKtp: e.target.value })}
                  className="input-field pl-12"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* No WhatsApp */}
            <div>
              <label htmlFor="noWhatsapp" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                No. WhatsApp <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="noWhatsapp"
                  type="tel"
                  value={profileData.noWhatsapp}
                  onChange={(e) => setProfileData({ ...profileData, noWhatsapp: e.target.value })}
                  className="input-field pl-12"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Alamat Lengkap <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <textarea
                  id="alamat"
                  value={profileData.alamat}
                  onChange={(e) => setProfileData({ ...profileData, alamat: e.target.value })}
                  rows={3}
                  className="input-field resize-none pl-12"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--accent-primary)]" />
            Ganti Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Password Saat Ini <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input-field pl-12 pr-12"
                  required
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Password Baru <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input-field pl-12 pr-12"
                  required
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                Konfirmasi Password Baru <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-field pl-12 pr-12"
                  required
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Ganti Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
