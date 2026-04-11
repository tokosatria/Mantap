/**
 * Server-side auth utilities
 *
 * Functions to get current user from Supabase Auth in server components
 */

import { createSupabaseClientForApi, getCurrentUserId } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        noKtp: true,
        noWhatsapp: true,
        alamat: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
