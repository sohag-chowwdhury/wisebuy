// types/supabase.ts - Pipeline Database Types

export type Product = {
  id: string;
  user_id: string;
  name: string;
  model: string | null;
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
  amazon_link: string | null;
  msrp: number | null;
  competitive_price: number | null;
  brand: string | null;
  category: string | null;
  year: string | null;
  weight: string | null;
  dimensions: string | null;
  created_at: string;
  updated_at: string;
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
