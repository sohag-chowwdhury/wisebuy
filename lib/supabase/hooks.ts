// lib/supabase/hooks.ts
import { useEffect, useState } from 'react'
import { supabase } from './client'
import { Database } from './types'
import { useAuth } from './auth'

type Product = Database['public']['Tables']['products']['Row']
type PipelinePhase = Database['public']['Tables']['pipeline_phases']['Row']
type PipelineLog = Database['public']['Tables']['pipeline_logs']['Row']

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()

    // Set up real-time subscription
    const subscription = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Product change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => 
              prev.map(product => 
                product.id === payload.new.id ? payload.new as Product : product
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => 
              prev.filter(product => product.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return { products, loading, error }
}

export function useProductDetails(productId: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [phases, setPhases] = useState<PipelinePhase[]>([])
  const [logs, setLogs] = useState<PipelineLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return

    async function fetchProductDetails() {
      try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productError) throw productError
        setProduct(productData)

        // Fetch pipeline phases
        const { data: phasesData, error: phasesError } = await supabase
          .from('pipeline_phases')
          .select('*')
          .eq('product_id', productId)
          .order('phase_number', { ascending: true })

        if (phasesError) throw phasesError
        setPhases(phasesData || [])

        // Fetch recent logs
        const { data: logsData, error: logsError } = await supabase
          .from('pipeline_logs')
          .select('*')
          .eq('product_id', productId)
          .order('timestamp', { ascending: false })
          .limit(50)

        if (logsError) throw logsError
        setLogs(logsData || [])

      } catch (err) {
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
        (payload) => {
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