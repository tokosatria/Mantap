'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, FileText, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BottomNavigationProps {
  cartCount?: number;
  pendingOrderCount?: number;
  currentUser?: any;
}

export default function BottomNavigation({ cartCount = 0, pendingOrderCount = 0, currentUser }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    {
      name: 'Beranda',
      icon: Home,
      path: '/',
      active: pathname === '/',
    },
    {
      name: 'Produk',
      icon: ShoppingBag,
      path: '/products',
      active: pathname === '/products',
    },
    {
      name: 'Keranjang',
      icon: ShoppingCart,
      path: '/checkout',
      active: pathname === '/checkout',
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      name: 'Pesanan',
      icon: FileText,
      path: currentUser ? '/orders' : '/login',
      active: pathname === '/orders',
      badge: pendingOrderCount > 0 ? pendingOrderCount : undefined,
    },
    {
      name: 'Profil',
      icon: User,
      path: currentUser ? '/profile' : '/login',
      active: pathname === '/profile',
    },
  ];

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={`${item.name}-${index}`}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center relative w-full max-w-[80px] py-2 group transition-all duration-200"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    item.active
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium transition-all duration-200 ${
                  item.active
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
