// types/supabase.ts - Pipeline Database Types

export type Product = {
  id: string;
  user_id: string;
  name: string;
  model: string | null;
  brand: string | null;          // ADDED: Missing from database schema
  category: string | null;       // ADDED: Missing from database schema
  description: string | null;    // ADDED: Missing from database schema
  woocommerce_category_id: number | null; // ADDED: WooCommerce category ID for publishing
  year_released: string | null;
  status:
    | "uploading"
    | "processing"
    | "paused"
    | "completed"
    | "error"
    | "published";
  current_phase: number;
  ai_confidence: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  
  // ADDED: Missing fields from database schema
  technical_specs: Record<string, any>;
  key_features: string[] | null;
  dimensions: Record<string, any> | null;
  model_variations: string[] | null;
  seo_title: string | null;
  meta_description: string | null;
  url_slug: string | null;
  keywords: string[] | null;
  
  // Comprehensive analysis fields
  manufacturer: string | null;
  upc: string | null;
  item_number: string | null;
  product_description: string | null;
  width_inches: number | null;
  height_inches: number | null;
  depth_inches: number | null;
  weight_lbs: number | null;
  compliance_data: Record<string, any>;
  documentation_data: Record<string, any>;
  visual_content_needs: Record<string, any>;
  analysis_metadata: Record<string, any>;
};

export type PipelinePhase = {
  id: string;
  product_id: string;
  phase_number: number;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
};

export type ProductAnalysisData = {
  id: string;
  product_id: string;
  product_name: string;
  model: string | null;
  confidence: number | null;
  item_condition: string;
  condition_details: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketResearchData = {
  id: string;
  product_id: string;
  amazon_price: number | null;
  amazon_url: string | null;
  ebay_price: number | null;
  ebay_url: string | null;
  msrp: number | null;
  competitive_price: number | null;
  brand: string | null;
  category: string | null;
  year: string | null;
  weight: string | null;
  dimensions: string | null;
  created_at: string;
  updated_at: string;
  
  // Enhanced Amazon data
  amazon_prime_available: boolean | null;
  amazon_seller_type: string | null;
  amazon_rating: number | null;
  amazon_review_count: number | null;
  amazon_search_results_url: string | null;
  
  // Enhanced eBay data
  ebay_new_price_min: number | null;
  ebay_new_price_max: number | null;
  ebay_used_price_min: number | null;
  ebay_used_price_max: number | null;
  ebay_recent_sold_average: number | null;
  ebay_search_results_url: string | null;
  ebay_sold_listings_url: string | null;
  
  // Other retailers and market analysis
  other_retailers_data: Record<string, any>;
  target_demographics: string[] | null;
  seasonal_demand_pattern: string | null;
  complementary_products: string[] | null;
  key_selling_points: string[] | null;
  logistics_data: Record<string, any>;
  pricing_recommendation: Record<string, any>;
};

export type SEOAnalysisData = {
  id: string;
  product_id: string;
  seo_title: string | null;
  url_slug: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ProductListingData = {
  id: string;
  product_id: string;
  product_title: string | null;
  price: number | null;
  publishing_status: string | null;
  brand: string | null;
  category: string | null;
  item_condition: string | null;
  product_description: string | null;
  key_features: string[] | null;
  channels: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
};

export type PipelineLog = {
  id: string;
  product_id: string;
  phase_number: number | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "user_id" | "created_at">>;
      };
      pipeline_phases: {
        Row: PipelinePhase;
        Insert: Omit<PipelinePhase, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<PipelinePhase, "id" | "product_id" | "created_at">
        >;
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, "id" | "created_at">;
        Update: Partial<Omit<ProductImage, "id" | "product_id" | "created_at">>;
      };
      product_analysis_data: {
        Row: ProductAnalysisData;
        Insert: Omit<ProductAnalysisData, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<ProductAnalysisData, "id" | "product_id" | "created_at">
        >;
      };
      market_research_data: {
        Row: MarketResearchData;
        Insert: Omit<MarketResearchData, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<MarketResearchData, "id" | "product_id" | "created_at">
        >;
      };
      seo_analysis_data: {
        Row: SEOAnalysisData;
        Insert: Omit<SEOAnalysisData, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<SEOAnalysisData, "id" | "product_id" | "created_at">
        >;
      };
      product_listing_data: {
        Row: ProductListingData;
        Insert: Omit<ProductListingData, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<ProductListingData, "id" | "product_id" | "created_at">
        >;
      };
      pipeline_logs: {
        Row: PipelineLog;
        Insert: Omit<PipelineLog, "id" | "created_at">;
        Update: Partial<Omit<PipelineLog, "id" | "created_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
