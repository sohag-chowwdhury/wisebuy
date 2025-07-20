// lib/supabase/types.ts

// Define specific types for JSON fields instead of using 'any'
export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto'
  notifications?: {
    email?: boolean
    push?: boolean
    marketing?: boolean
  }
  preferences?: {
    language?: string
    timezone?: string
    currency?: string
  }
  [key: string]: unknown // Allow additional properties
}

export interface ProductFeature {
  name: string
  value: string | number | boolean
  confidence?: number
  source?: string
  [key: string]: unknown
}

export interface ProductSpecifications {
  dimensions?: {
    length?: number
    width?: number
    height?: number
    weight?: number
    unit?: string
  }
  technical?: {
    [key: string]: string | number | boolean
  }
  warranty?: {
    duration?: number
    type?: string
    provider?: string
  }
  [key: string]: unknown
}

export interface MarketResearch {
  competitors?: Array<{
    name: string
    price: number
    url?: string
    features?: string[]
  }>
  priceRange?: {
    min: number
    max: number
    average: number
  }
  trends?: {
    demand: 'high' | 'medium' | 'low'
    seasonality?: string
    marketGrowth?: number
  }
  [key: string]: unknown
}

export interface PlatformUrls {
  ebay?: string
  amazon?: string
  facebook?: string
  craigslist?: string
  mercari?: string
  [platform: string]: string | undefined
}

export interface ImageAnalysis {
  objectDetection?: Array<{
    label: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  colorAnalysis?: {
    dominantColors: string[]
    brightness: number
    contrast: number
  }
  textDetection?: {
    text: string
    confidence: number
    language?: string
  }
  qualityMetrics?: {
    sharpness: number
    exposure: number
    noise: number
  }
  [key: string]: unknown
}

export interface PhaseData {
  input?: {
    images?: string[]
    userInput?: string
    previousPhaseData?: Record<string, unknown>
  }
  output?: {
    extractedData?: Record<string, unknown>
    processedImages?: string[]
    analysis?: Record<string, unknown>
    generatedContent?: Record<string, unknown>
  }
  metadata?: {
    processingTime?: number
    aiModel?: string
    confidence?: number
    version?: string
  }
  [key: string]: unknown
}

export interface JobPayload {
  productId?: string
  phaseNumber?: number
  parameters?: Record<string, unknown>
  retry?: boolean
  priority?: number
  [key: string]: unknown
}

export interface JobResult {
  success: boolean
  data?: Record<string, unknown>
  metrics?: {
    processingTime: number
    resourceUsage?: Record<string, number>
  }
  artifacts?: string[]
  [key: string]: unknown
}

export interface PublishData {
  title: string
  description: string
  price: number
  images: string[]
  category?: string
  condition?: string
  tags?: string[]
  shipping?: {
    cost: number
    method: string
    handling_time: number
  }
  [key: string]: unknown
}

export interface PlatformResponse {
  success: boolean
  platformId?: string
  url?: string
  fees?: {
    listing: number
    selling: number
    payment: number
  }
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  [key: string]: unknown
}

export interface LogDetails {
  phaseNumber?: number
  operation?: string
  duration?: number
  memoryUsage?: number
  apiCalls?: number
  error?: {
    type: string
    stack?: string
    context?: Record<string, unknown>
  }
  [key: string]: unknown
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'manager'
          settings: UserSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'manager'
          settings?: UserSettings
        }
        Update: {
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'manager'
          settings?: UserSettings
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string | null
          model: string | null
          brand: string | null
          category: string | null
          status: 'uploaded' | 'processing' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'completed' | 'published' | 'error' | 'paused' | 'cancelled'
          current_phase: number
          progress: number
          priority: number
          ai_confidence: number | null
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          condition_details: string | null
          identified_features: ProductFeature[]
          msrp: number | null
          amazon_price: number | null
          amazon_link: string | null
          competitive_price: number | null
          specifications: ProductSpecifications
          market_research: MarketResearch
          suggested_price: number | null
          final_price: number | null
          description: string | null
          short_description: string | null
          key_features: string[] | null
          seo_title: string | null
          meta_description: string | null
          url_slug: string | null
          keywords: string[] | null
          published_platforms: string[]
          platform_urls: PlatformUrls
          error_message: string | null
          error_phase: number | null
          retry_count: number
          created_at: string
          updated_at: string
          started_processing_at: string | null
          completed_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          model?: string | null
          brand?: string | null
          category?: string | null
          status?: 'uploaded' | 'processing' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'completed' | 'published' | 'error' | 'paused' | 'cancelled'
          current_phase?: number
          progress?: number
          priority?: number
          ai_confidence?: number | null
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          condition_details?: string | null
          identified_features?: ProductFeature[]
          msrp?: number | null
          amazon_price?: number | null
          amazon_link?: string | null
          competitive_price?: number | null
          specifications?: ProductSpecifications
          market_research?: MarketResearch
          suggested_price?: number | null
          final_price?: number | null
          description?: string | null
          short_description?: string | null
          key_features?: string[] | null
          seo_title?: string | null
          meta_description?: string | null
          url_slug?: string | null
          keywords?: string[] | null
          published_platforms?: string[]
          platform_urls?: PlatformUrls
          error_message?: string | null
          error_phase?: number | null
          retry_count?: number
        }
        Update: {
          name?: string | null
          model?: string | null
          brand?: string | null
          category?: string | null
          status?: 'uploaded' | 'processing' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'completed' | 'published' | 'error' | 'paused' | 'cancelled'
          current_phase?: number
          progress?: number
          priority?: number
          ai_confidence?: number | null
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          condition_details?: string | null
          identified_features?: ProductFeature[]
          msrp?: number | null
          amazon_price?: number | null
          amazon_link?: string | null
          competitive_price?: number | null
          specifications?: ProductSpecifications
          market_research?: MarketResearch
          suggested_price?: number | null
          final_price?: number | null
          description?: string | null
          short_description?: string | null
          key_features?: string[] | null
          seo_title?: string | null
          meta_description?: string | null
          url_slug?: string | null
          keywords?: string[] | null
          published_platforms?: string[]
          platform_urls?: PlatformUrls
          error_message?: string | null
          error_phase?: number | null
          retry_count?: number
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          storage_path: string
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          is_primary: boolean
          alt_text: string | null
          processing_status: 'uploaded' | 'processing' | 'analyzed' | 'optimized' | 'error'
          ai_analysis: ImageAnalysis
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          storage_path: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          is_primary?: boolean
          alt_text?: string | null
          processing_status?: 'uploaded' | 'processing' | 'analyzed' | 'optimized' | 'error'
          ai_analysis?: ImageAnalysis
        }
        Update: {
          image_url?: string
          storage_path?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          is_primary?: boolean
          alt_text?: string | null
          processing_status?: 'uploaded' | 'processing' | 'analyzed' | 'optimized' | 'error'
          ai_analysis?: ImageAnalysis
        }
      }
      pipeline_phases: {
        Row: {
          id: string
          product_id: string
          phase_number: number
          status: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'cancelled'
          started_at: string | null
          completed_at: string | null
          duration_seconds: number | null
          input_data: PhaseData
          output_data: PhaseData
          error_message: string | null
          retry_count: number
          worker_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          phase_number: number
          status?: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'cancelled'
          started_at?: string | null
          completed_at?: string | null
          duration_seconds?: number | null
          input_data?: PhaseData
          output_data?: PhaseData
          error_message?: string | null
          retry_count?: number
          worker_id?: string | null
        }
        Update: {
          status?: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'cancelled'
          started_at?: string | null
          completed_at?: string | null
          duration_seconds?: number | null
          input_data?: PhaseData
          output_data?: PhaseData
          error_message?: string | null
          retry_count?: number
          worker_id?: string | null
        }
      }
      pipeline_logs: {
        Row: {
          id: string
          product_id: string
          phase_id: string | null
          level: 'debug' | 'info' | 'warn' | 'error'
          message: string
          details: LogDetails
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          phase_id?: string | null
          level?: 'debug' | 'info' | 'warn' | 'error'
          message: string
          details?: LogDetails
          timestamp?: string
        }
        Update: {
          level?: 'debug' | 'info' | 'warn' | 'error'
          message?: string
          details?: LogDetails
          timestamp?: string
        }
      }
      background_jobs: {
        Row: {
          id: string
          job_type: string
          product_id: string | null
          phase_number: number | null
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority: number
          payload: JobPayload
          result: JobResult
          error_message: string | null
          retry_count: number
          max_retries: number
          scheduled_at: string
          started_at: string | null
          completed_at: string | null
          worker_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_type: string
          product_id?: string | null
          phase_number?: number | null
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          payload?: JobPayload
          result?: JobResult
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          worker_id?: string | null
        }
        Update: {
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          payload?: JobPayload
          result?: JobResult
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          worker_id?: string | null
        }
      }
      publishing_history: {
        Row: {
          id: string
          product_id: string
          platform: string
          platform_product_id: string | null
          platform_url: string | null
          status: 'pending' | 'published' | 'failed' | 'updated' | 'removed'
          publish_data: PublishData
          response_data: PlatformResponse
          error_message: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          platform: string
          platform_product_id?: string | null
          platform_url?: string | null
          status?: 'pending' | 'published' | 'failed' | 'updated' | 'removed'
          publish_data?: PublishData
          response_data?: PlatformResponse
          error_message?: string | null
          published_at?: string | null
        }
        Update: {
          platform_product_id?: string | null
          platform_url?: string | null
          status?: 'pending' | 'published' | 'failed' | 'updated' | 'removed'
          publish_data?: PublishData
          response_data?: PlatformResponse
          error_message?: string | null
          published_at?: string | null
        }
      }
    }
    Functions: {
      start_phase: {
        Args: {
          p_product_id: string
          p_phase_number: number
        }
        Returns: string
      }
      complete_phase: {
        Args: {
          p_phase_id: string
          p_output_data?: PhaseData
        }
        Returns: boolean
      }
      error_phase: {
        Args: {
          p_phase_id: string
          p_error_message: string
        }
        Returns: boolean
      }
    }
  }
}

// Type helpers for working with the database
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient type aliases
export type Product = Tables<'products'>['Row']
export type ProductInsert = Tables<'products'>['Insert']
export type ProductUpdate = Tables<'products'>['Update']

export type ProductImage = Tables<'product_images'>['Row']
export type ProductImageInsert = Tables<'product_images'>['Insert']
export type ProductImageUpdate = Tables<'product_images'>['Update']

export type PipelinePhase = Tables<'pipeline_phases'>['Row']
export type PipelinePhaseInsert = Tables<'pipeline_phases'>['Insert']
export type PipelinePhaseUpdate = Tables<'pipeline_phases'>['Update']

export type UserProfile = Tables<'user_profiles'>['Row']
export type UserProfileInsert = Tables<'user_profiles'>['Insert']
export type UserProfileUpdate = Tables<'user_profiles'>['Update']