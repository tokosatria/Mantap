import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency to Indonesian Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian locale
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate order number
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `ORD-${dateStr}-${random}`;
}

// Validate KTP/NPWP (16 digits)
export function validateKTP(ktp: string): boolean {
  return /^[0-9]{16}$/.test(ktp);
}

// Validate WhatsApp number (Indonesia format)
export function validateWhatsApp(phone: string): boolean {
  // Accept: 08xxx, 628xxx, +628xxx
  return /^(\+62|62|0)8[0-9]{8,11}$/.test(phone);
}

// Format phone number to standard format
export function formatPhoneNumber(phone: string): string {
  // Remove +62 and replace with 0
  return phone.replace(/^\+62/, '0').replace(/^62/, '0');
}

// Status badge colors
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-blue-500/20 text-blue-500',
    paid: 'bg-purple-500/20 text-purple-500',
    completed: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500',
    active: 'bg-green-500/20 text-green-500',
    inactive: 'bg-gray-500/20 text-gray-500',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-500';
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Calculate discount percentage
export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

// Sleep function for async delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse JWT token (basic)
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
