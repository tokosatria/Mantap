import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Image upload to Supabase will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create a Supabase client for API routes that reads cookies from the request
 * This is used in API routes to get the authenticated user
 */
export async function createSupabaseClientForApi() {
  const cookieStore = await cookies();

  // Get access and refresh tokens from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Create client with manual token handling
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          if (key === 'sb-access-token') return accessToken || null;
          if (key === 'sb-refresh-token') return refreshToken || null;
          return null;
        },
        setItem: () => {
          // In API routes, we don't persist storage
        },
        removeItem: () => {
          // In API routes, we don't persist storage
        },
      },
    },
  });

  // Manually set session if tokens exist
  if (accessToken && refreshToken) {
    try {
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }

  return client;
}

/**
 * Get current authenticated user in API routes
 * Returns the user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabaseClient = await createSupabaseClientForApi();
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Bucket name for product images
export const PRODUCT_IMAGES_BUCKET = 'product-images';

// Helper function to get public URL for a file
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================================================
// SUPABASE AUTH HELPER FUNCTIONS
// ============================================================================

/**
 * Convert WhatsApp number to email format for Supabase Auth
 * Example: "628123456789" -> "user628123456789@Satria Elektronik.app"
 */
export function whatsappToEmail(noWhatsapp: string): string {
  // Clean the phone number (remove +, spaces, dashes)
  const cleaned = noWhatsapp.replace(/[\+\s\-]/g, '');
  return `user${cleaned}@Satria Elektronik.app`;
}

/**
 * Convert email back to WhatsApp number
 * Example: "user628123456789@Satria Elektronik.app" -> "628123456789"
 */
export function emailToWhatsapp(email: string): string {
  // Remove "user" prefix and "@Satria Elektronik.app" suffix
  return email.replace(/^user/, '').replace(/@Satria Elektronik\.app$/, '');
}

/**
 * Get current authenticated user from Supabase Auth
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get session from Supabase Auth
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}
