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

// Bucket name for QRIS images
export const QRIS_BUCKET = 'qris-images';

// Helper function to get public URL for a file
export function getPublicUrl(path: string, bucket: string = PRODUCT_IMAGES_BUCKET): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================================================
// SUPABASE AUTH HELPER FUNCTIONS
// ============================================================================

/**
 * Convert WhatsApp number to email format for Supabase Auth
 * Example: "628123456789" -> "user628123456789@tokoku.app"
 */
export function whatsappToEmail(noWhatsapp: string): string {
  // Clean the phone number - remove ALL non-digit characters
  // This removes: +, -, space, (, ), etc.
  const cleaned = noWhatsapp.replace(/[^\d]/g, '');

  // Validate that we have a reasonable phone number
  // Should be at least 10 digits (country code + number)
  if (!cleaned || cleaned.length < 10) {
    // If invalid, return a fallback email
    return `user-invalid@tokoku.app`;
  }

  // Ensure it starts with country code (62 for Indonesia)
  // If user inputs "08123456789", convert to "628123456789"
  let normalizedNumber = cleaned;
  if (cleaned.startsWith('0')) {
    normalizedNumber = '62' + cleaned.slice(1);
  }

  return `user${normalizedNumber}@tokoku.app`;
}

/**
 * Convert email back to WhatsApp number
 * Example: "user628123456789@tokoku.app" -> "628123456789"
 */
export function emailToWhatsapp(email: string): string {
  // Remove "user" prefix and "@tokoku.app" suffix
  return email.replace(/^user/, '').replace(/@tokoku\.app$/, '');
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
