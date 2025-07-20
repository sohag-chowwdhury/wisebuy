// lib/supabase/auth.ts
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Server-side authentication (for API routes only)
export async function getUserId(): Promise<string> {
  // Only run in server environment
  if (typeof window !== 'undefined') {
    throw new AuthError('getUserId can only be used in server environment');
  }

  try {
    // Method 1: Try to get user ID from middleware headers (fastest)
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    
    if (userId) {
      console.log('✅ [AUTH] User ID from headers:', userId);
      return userId;
    }
  } catch (error) {
    console.warn('⚠️ [AUTH] Could not get headers:', error);
  }

  // Method 2: Get user ID directly from Supabase (fallback)
  try {
    console.log('🔄 [AUTH] Falling back to Supabase auth...');
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ [AUTH] Supabase auth error:', error);
      throw new AuthError(`Authentication failed: ${error.message}`);
    }

    if (!user) {
      console.error('❌ [AUTH] No user found');
      throw new AuthError("User not authenticated");
    }

    console.log('✅ [AUTH] User ID from Supabase:', user.id);
    return user.id;

  } catch (error) {
    console.error('❌ [AUTH] Failed to get user from Supabase:', error);
    
    if (error instanceof AuthError) {
      throw error;
    }
    
    throw new AuthError("Authentication failed");
  }
}

// Client-side authentication (for components)
export async function getClientUserId(): Promise<string> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new AuthError('getClientUserId can only be used in browser environment');
  }

  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AuthError("User not authenticated");
    }

    return user.id;
  } catch (error) {
    console.error('❌ [CLIENT AUTH] Authentication failed:', error);
    throw new AuthError("Authentication failed");
  }
}

// Universal auth check that works in both server and client contexts
export async function getCurrentUser() {
  try {
    // Try client-side first (works in components)
    if (typeof window !== 'undefined') {
      return await getClientUserId();
    }
    
    // Server-side (works in API routes)
    return await getUserId();
  } catch (error) {
    throw new AuthError("Authentication failed");
  }
}