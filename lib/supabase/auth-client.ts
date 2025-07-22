"use client";

import { useState, useEffect } from 'react';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Client-side authentication (for components)
export async function getClientUserId(): Promise<string> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new AuthError('getClientUserId can only be used in browser environment');
  }

  try {
    const clientModule = await import('@/lib/supabase/client');
    
    const { data: { user }, error } = await clientModule.supabase.auth.getUser();

    if (error || !user) {
      throw new AuthError("User not authenticated");
    }

    return user.id;
  } catch (error) {
    console.error('❌ [CLIENT AUTH] Authentication failed:', error);
    throw new AuthError("Authentication failed");
  }
}

// React hook for client-side authentication
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        // Only run in browser
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const clientModule = await import('./client');
        const { data: { user }, error } = await clientModule.supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          setError(error.message);
        } else {
          setUser(user);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    // Set up auth state change listener
    const setupAuthListener = async () => {
      if (typeof window !== 'undefined') {
        const clientModule = await import('./client');
        const { data: { subscription } } = clientModule.supabase.auth.onAuthStateChange((event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setError(null);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    let cleanup: (() => void) | undefined;
    setupAuthListener().then(fn => {
      cleanup = fn;
    });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  return { user, loading, error };
} 