// types/pipeline.ts - Pipeline Utility Types and Helpers
import type {
  Product,
  PipelinePhase,
  ProductAnalysisData,
  MarketResearchData,
  SEOAnalysisData,
  ProductListingData,
  Database,
} from "./supabase";

// Enhanced product type with UI-specific fields
export type EnhancedProduct = Product & {
  phases?: PipelinePhase[];
  productAnalysisData?: ProductAnalysisData;
  marketResearchData?: MarketResearchData;
  seoAnalysisData?: SEOAnalysisData;
  productListingData?: ProductListingData;
  thumbnailUrl?: string;
  progress?: number;
};

// Utility types for database operations
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type PhaseRow = Database["public"]["Tables"]["pipeline_phases"]["Row"];
export type PhaseInsert =
  Database["public"]["Tables"]["pipeline_phases"]["Insert"];
export type PhaseUpdate =
  Database["public"]["Tables"]["pipeline_phases"]["Update"];

export type ProductAnalysisRow =
  Database["public"]["Tables"]["product_analysis_data"]["Row"];
export type ProductAnalysisInsert =
  Database["public"]["Tables"]["product_analysis_data"]["Insert"];
export type ProductAnalysisUpdate =
  Database["public"]["Tables"]["product_analysis_data"]["Update"];

export type MarketResearchRow =
  Database["public"]["Tables"]["market_research_data"]["Row"];
export type MarketResearchInsert =
  Database["public"]["Tables"]["market_research_data"]["Insert"];
export type MarketResearchUpdate =
  Database["public"]["Tables"]["market_research_data"]["Update"];

export type SEOAnalysisRow =
  Database["public"]["Tables"]["seo_analysis_data"]["Row"];
export type SEOAnalysisInsert =
  Database["public"]["Tables"]["seo_analysis_data"]["Insert"];
export type SEOAnalysisUpdate =
  Database["public"]["Tables"]["seo_analysis_data"]["Update"];

export type ProductListingRow =
  Database["public"]["Tables"]["product_listing_data"]["Row"];
export type ProductListingInsert =
  Database["public"]["Tables"]["product_listing_data"]["Insert"];
export type ProductListingUpdate =
  Database["public"]["Tables"]["product_listing_data"]["Update"];

// Phase status types
export type PhaseStatus = "pending" | "running" | "completed" | "failed";
export type ProductStatus =
  | "uploading"
  | "processing"
  | "paused"
  | "completed"
  | "error"
  | "published";

// Helper function to create product insert
export const createProductInsert = (params: {
  userId: string;
  name: string;
  model?: string | null;
  status?: ProductStatus;
  currentPhase?: number;
  aiConfidence?: number | null;
}): ProductInsert => {
  return {
    user_id: params.userId,
    name: params.name,
    model: params.model || null,
    status: params.status || "uploading",
    current_phase: params.currentPhase || 1,
    ai_confidence: params.aiConfidence || null,
    error_message: null,
    year_released: null,
  };
};

// Helper function to create phase insert
export const createPhaseInsert = (params: {
  productId: string;
  phaseNumber: number;
  status?: PhaseStatus;
}): PhaseInsert => {
  return {
    product_id: params.productId,
    phase_number: params.phaseNumber,
    status: params.status || "pending",
    started_at: null,
    completed_at: null,
    error_message: null,
  };
};

// Helper function to create product analysis data insert
export const createProductAnalysisInsert = (params: {
  productId: string;
  productName: string;
  model?: string | null;
  confidence?: number | null;
  itemCondition: string;
  conditionDetails?: string | null;
}): ProductAnalysisInsert => {
  return {
    product_id: params.productId,
    product_name: params.productName,
    model: params.model || null,
    confidence: params.confidence || null,
    item_condition: params.itemCondition,
    condition_details: params.conditionDetails || null,
  };
};

// Helper function to create market research data insert
export const createMarketResearchInsert = (params: {
  productId: string;
  amazonPrice?: number | null;
  amazonLink?: string | null;
  msrp?: number | null;
  competitivePrice?: number | null;
  brand?: string | null;
  category?: string | null;
  year?: string | null;
  weight?: string | null;
  dimensions?: string | null;
}): MarketResearchInsert => {
  return {
    product_id: params.productId,
    amazon_price: params.amazonPrice || null,
    amazon_link: params.amazonLink || null,
    ebay_price: null,
    ebay_link: null,
    msrp: params.msrp || null,
    competitive_price: params.competitivePrice || null,
    brand: params.brand || null,
    category: params.category || null,
    year: params.year || null,
    weight: params.weight || null,
    dimensions: params.dimensions || null,
  };
};

// Helper function to create SEO analysis data insert
export const createSEOAnalysisInsert = (params: {
  productId: string;
  seoTitle?: string | null;
  urlSlug?: string | null;
  metaDescription?: string | null;
  keywords?: string[] | null;
  tags?: string[] | null;
}): SEOAnalysisInsert => {
  return {
    product_id: params.productId,
    seo_title: params.seoTitle || null,
    url_slug: params.urlSlug || null,
    meta_description: params.metaDescription || null,
    keywords: params.keywords || null,
    tags: params.tags || null,
  };
};

// Helper function to create product listing data insert
export const createProductListingInsert = (params: {
  productId: string;
  productTitle?: string | null;
  price?: number | null;
  publishingStatus?: string | null;
  brand?: string | null;
  category?: string | null;
  itemCondition?: string | null;
  productDescription?: string | null;
  keyFeatures?: string[] | null;
  channels?: Record<string, boolean> | null;
}): ProductListingInsert => {
  return {
    product_id: params.productId,
    product_title: params.productTitle || null,
    price: params.price || null,
    publishing_status: params.publishingStatus || null,
    brand: params.brand || null,
    category: params.category || null,
    item_condition: params.itemCondition || null,
    product_description: params.productDescription || null,
    key_features: params.keyFeatures || null,
    channels: params.channels || null,
  };
};

// Pipeline progress calculation helper
export const calculateProgress = (phases: PipelinePhase[]): number => {
  if (!phases || phases.length === 0) return 0;

  const completedPhases = phases.filter(
    (phase) => phase.status === "completed"
  ).length;
  return Math.round((completedPhases / phases.length) * 100);
};

// Phase status helpers
export const canStartPhase = (
  phaseNumber: number,
  phases: PipelinePhase[]
): boolean => {
  if (phaseNumber === 1) return true;

  const previousPhase = phases.find((p) => p.phase_number === phaseNumber - 1);
  return previousPhase?.status === "completed";
};

export const getPhaseStatus = (
  phaseNumber: number,
  phases: PipelinePhase[]
): PhaseStatus => {
  const phase = phases.find((p) => p.phase_number === phaseNumber);
  return phase?.status || "pending";
};
