// TypeScript Types for Satria Elektronik E-Commerce

export interface User {
  id: string;
  nama: string;
  noKtp: string;
  noWhatsapp: string;
  alamat: string;
  password: string;
  role: 'admin' | 'agen';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User type without password (for client-side use)
export type UserWithoutPassword = Omit<User, 'password'>;

export interface Category {
  id: string;
  name: string;
  nama: string; // Alias for name
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  nama: string; // Alias for name
  description: string;
  deskripsi: string; // Alias for description
  basePrice: number;
  harga: number; // Alias for basePrice
  imageUrl: string;
  gambar: string; // Alias for imageUrl
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  variants?: Variant[];
}

export interface Variant {
  id: string;
  productId: string;
  variantName: string;
  nama: string; // Alias for variantName
  price: number;
  harga: number; // Alias for price
  stock: number;
  stok: number; // Alias for stock
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  updatedAt: Date;
  user?: UserWithoutPassword;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variant?: Variant;
  product?: Product; // Populated from variant.product
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrder {
  id: string;
  userId: string;
  serviceId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemDescription: string;
  problemDescription: string;
  estimatedPrice: number;
  dpAmount: number;
  finalPrice: number;
  remainingAmount: number;
  status: 'pending' | 'in_progress' | 'dp_paid' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  updatedAt: Date;
  user?: UserWithoutPassword;
  service?: Service;
}

export interface CartItem {
  id: string;
  userId: string;
  variantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  variant?: Variant;
}

// Auth Types
export interface LoginRequest {
  noWhatsapp: string;
  password: string;
}

export interface RegisterRequest {
  nama: string;
  noKtp: string;
  noWhatsapp: string;
  alamat: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserWithoutPassword;
  message: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
