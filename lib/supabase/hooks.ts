// lib/supabase/hooks.ts
import { useEffect, useState } from 'react'
import { supabase } from './client'
import { Database } from './types'
// RealtimePostgresChangesPayload import removed as it's not used
// Note: Authentication disabled for now, will be implemented later

type Product = Database['public']['Tables']['products']['Row']
type PipelinePhase = Database['public']['Tables']['pipeline_phases']['Row']
type PipelineLog = Database['public']['Tables']['pipeline_logs']['Row']

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use the correct user ID where your products are stored
  const DEFAULT_USER_ID = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1';
  
  console.log('🔧 [useProducts] Loading products without authentication (using default user)');

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('📡 [useProducts] Fetching from API endpoint with user_id:', DEFAULT_USER_ID);
        
        // Use API route instead of direct admin client
        const response = await fetch('/api/dashboard/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 [useProducts] API response:', { 
          dataCount: data?.products?.length || 0,
          firstProduct: data.products?.[0],
          hasImages: data.products?.some((p: any) => p.thumbnailUrl)
        });

        setProducts(data.products || [])
        console.log('✅ [useProducts] Final products set:', data.products?.length || 0);
        
      } catch (err) {
        console.error('❌ [useProducts] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()

    // Add polling fallback - refresh every 10 seconds to ensure updates are visible
    const pollInterval = setInterval(() => {
      console.log('🔄 [useProducts] Polling for updates...');
      fetchProducts();
    }, 10000);

    // Clean up polling on unmount
    const cleanup = () => {
      clearInterval(pollInterval);
    };

    // Removed force refresh events to prevent excessive API calls

    // Set up real-time subscription for both products and pipeline phases
    const subscription = supabase
      .channel('products_and_phases_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${DEFAULT_USER_ID}`,
        },
        async (payload: any) => {
          console.log('🔄 [useProducts] Real-time product change detected:', {
            event: payload.eventType,
            productId: payload.new?.id || payload.old?.id,
            newStatus: payload.new?.status,
            oldStatus: payload.old?.status
          });
          
          // Instead of trying to transform raw data, refetch from API to get consistent structure
          try {
            const response = await fetch('/api/dashboard/products', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ [useProducts] Real-time refetch successful, got', data.products?.length || 0, 'products');
              setProducts(data.products || []);
            }
          } catch (err) {
            console.error('❌ [useProducts] Real-time refetch failed:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_phases',
        },
        async (payload: any) => {
          console.log('🔄 [useProducts] Real-time pipeline phase change detected:', {
            event: payload.eventType,
            productId: payload.new?.product_id || payload.old?.product_id,
            phaseNumber: payload.new?.phase_number || payload.old?.phase_number,
            status: payload.new?.status || payload.old?.status
          });
          
          // Pipeline phase changes also trigger product refetch to update progress
          try {
            const response = await fetch('/api/dashboard/products', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ [useProducts] Pipeline phase refetch successful');
              setProducts(data.products || []);
            }
          } catch (err) {
            console.error('❌ [useProducts] Pipeline phase refetch failed:', err);
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 [useProducts] Subscription status:', status);
      })

    return () => {
      cleanup();
      subscription.unsubscribe()
    }
  }, [])

  return { products, loading, error }
}

export function useProductDetails(productId: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [phases, setPhases] = useState<PipelinePhase[]>([])
  const [logs, setLogs] = useState<PipelineLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🔧 [useProductDetails] Loading product details for:', productId);

  useEffect(() => {
    if (!productId) return

    async function fetchProductDetails() {
      try {
        console.log('📡 [useProductDetails] Fetching from API endpoint...');
        
        // Use API route instead of direct admin client
        const response = await fetch(`/api/dashboard/products/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Set product details from API response (product is returned directly)
        setProduct(data)
        setPhases(data.phases || [])
        setLogs(data.logs || [])

      } catch (err) {
        console.error('❌ [useProductDetails] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product details')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetails()

    // Set up real-time subscriptions
    const productSubscription = supabase
      .channel(`product_${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload: any) => {
          setProduct(payload.new as Product)
        }
      )
      .subscribe()

    const phasesSubscription = supabase
      .channel(`phases_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_phases',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPhases(prev => [...prev, payload.new as PipelinePhase].sort((a, b) => a.phase_number - b.phase_number))
          } else if (payload.eventType === 'UPDATE') {
            setPhases(prev => 
              prev.map(phase => 
                phase.id === payload.new.id ? payload.new as PipelinePhase : phase
              )
            )
          }
        }
      )
      .subscribe()

    const logsSubscription = supabase
      .channel(`logs_${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pipeline_logs',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          setLogs(prev => [payload.new as PipelineLog, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => {
      productSubscription.unsubscribe()
      phasesSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [productId])

  return { product, phases, logs, loading, error }
}