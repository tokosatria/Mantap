import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import Header from '@/components/Header';
import { UserWithoutPassword } from '@/types/index';

// Disable static optimization for this layout
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disable caching to ensure cookies are always read fresh
  noStore();

  let currentUser: UserWithoutPassword | null = null;

  try {
    // Get current user from API (Supabase Auth)
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`, {
      cache: 'no-store',
      headers: {
        // Forward all cookies for Supabase Auth
        cookie: cookieStore.toString(),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        currentUser = data.data;
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    // Continue with currentUser as null
  }

  return (
    <>
      <Header currentUser={currentUser} />
      <main className="min-h-screen pt-16 md:pt-20">
        {children}
      </main>
    </>
  );
}
