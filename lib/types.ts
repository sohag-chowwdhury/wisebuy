// lib/types.ts - Complete types for the entire application

// =====================================================
// CORE UPLOAD AND PROCESSING TYPES
// =====================================================

export type UploadStage = "uploading" | "analyzing" | "validation" | "complete";
export type ProcessingPhase = 1 | 2 | 3 | 4;

// =====================================================
// PRODUCT ANALYSIS TYPES
// =====================================================

export interface ProductAnalysis {
  model: string;
  confidence: number;
  defects: string[];
  condition?: string;
  categories?: string[];
  brands?: string[];
  colors?: Record<string, any>;
  imageQuality?: number;
  completeness?: number;
}

// =====================================================
// MSRP DATA TYPES
// =====================================================

export interface MSRPData {
  currentSellingPrice: number;
  originalMSRP: number;
  priceTrend: string;
  currency: string;
  lastUpdated: string;
  sources: string[];
}

// =====================================================
// PRODUCT SPECIFICATIONS TYPES
// =====================================================

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
  weight: string;
}

export interface ProductSpecifications {
  brand: string;
  model: string;
  category: string;
  yearReleased: string;
  dimensions: ProductDimensions;
  keyFeatures: string[];
  technicalSpecs: Record<string, string>;
  modelVariations: string[];
  description: string;
}

// =====================================================
// COMPETITIVE ANALYSIS TYPES
// =====================================================

export interface PlatformPricing {
  averagePrice: number;
  priceRange: { low: number; high: number };
}

export interface EbayPricing extends PlatformPricing {
  activeListings: number;
  soldListings: number;
}

export interface CompetitiveData {
  platforms: {
    ebay: EbayPricing;
    facebook: PlatformPricing;
  };
  bestPlatforms: string[];
  marketDemand: string;
  recommendedConditions: string[];
  insights: string;
}

// =====================================================
// PRICING TYPES
// =====================================================

export interface PricingRequest {
  productModel: string;
  condition: string;
  competitiveData: CompetitiveData;
  currentSellingPrice: number;
}

export interface CompetitivePrice {
  platform: string;
  averagePrice: number;
  priceRange: { low: number; high: number };
}

export interface PricingSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  competitivePrices: CompetitivePrice[];
  pricingStrategy: string;
  profitMargin: number;
  reasoning: string[];
  confidence: number;
}

// =====================================================
// SEO TYPES
// =====================================================

export interface SEORequest {
  productModel: string;
  specifications: ProductSpecifications;
  msrpData: MSRPData;
  condition: string;
  finalPrice: number;
}

export interface SEOData {
  slug: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  longTailKeywords: string[];
  productDescription: string;
  bulletPoints: string[];
  schemaMarkup: object;
  tags: string[];
}

// =====================================================
// STREAMING DATA TYPES
// =====================================================

export interface ProgressData {
  type: "progress";
  value: number;
}

export interface StatusData {
  type: "status";
  message: string;
}

export interface AnalysisData {
  type: "analysis";
  result: ProductAnalysis;
}

export interface MSRPResponseData {
  type: "msrp";
  result: MSRPData;
}

export interface SpecificationData {
  type: "specifications";
  result: ProductSpecifications;
}

export interface CompetitiveAnalysisData {
  type: "competitive";
  result: CompetitiveData;
}

export interface PricingSuggestionData {
  type: "pricing";
  result: PricingSuggestion;
}

export interface SEOResponseData {
  type: "seo";
  result: SEOData;
}

export interface CompletionData {
  type: "complete";
  result: {
    productId: string;
    message: string;
    success: boolean;
    canCloseModal?: boolean;
    imageUrls?: string[];
  };
}

export interface ErrorData {
  type: "error";
  message: string;
}

// Union type for all streaming data
export type StreamingData = 
  | ProgressData
  | StatusData 
  | AnalysisData
  | MSRPResponseData
  | SpecificationData
  | CompetitiveAnalysisData
  | PricingSuggestionData
  | SEOResponseData
  | CompletionData
  | ErrorData;

// =====================================================
// TYPE GUARDS FOR STREAMING DATA
// =====================================================

export function isProgressData(data: StreamingData): data is ProgressData {
  return data.type === "progress";
}

export function isStatusData(data: StreamingData): data is StatusData {
  return data.type === "status";
}

export function isAnalysisData(data: StreamingData): data is AnalysisData {
  return data.type === "analysis";
}

export function isMSRPData(data: StreamingData): data is MSRPResponseData {
  return data.type === "msrp";
}

export function isSpecificationData(data: StreamingData): data is SpecificationData {
  return data.type === "specifications";
}

export function isCompetitiveData(data: StreamingData): data is CompetitiveAnalysisData {
  return data.type === "competitive";
}

export function isPricingData(data: StreamingData): data is PricingSuggestionData {
  return data.type === "pricing";
}

export function isSEOData(data: StreamingData): data is SEOResponseData {
  return data.type === "seo";
}

export function isCompletionData(data: StreamingData): data is CompletionData {
  return data.type === "complete";
}

export function isErrorData(data: StreamingData): data is ErrorData {
  return data.type === "error";
}

// =====================================================
// PRODUCT CONDITION TYPES
// =====================================================

export type ProductCondition = "new" | "excellent" | "good" | "fair" | "poor";

export type ItemCondition =
  | "new"
  | "open-box"
  | "refurbished"
  | "used-like-new"
  | "used-good"
  | "used-fair"
  | "used-poor"
  | "for-parts";

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  "new",
  "excellent",
  "good",
  "fair",
  "poor",
];

export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "open-box", label: "Open Box" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used-like-new", label: "Used - Like New" },
  { value: "used-good", label: "Used - Good" },
  { value: "used-fair", label: "Used - Fair" },
  { value: "used-poor", label: "Used - Poor" },
  { value: "for-parts", label: "For Parts or Not Working" },
];

export interface ConditionInspection {
  itemCondition: ItemCondition;
  productCondition: string; // Human-entered details like "missing button", "scratched on left side"
}

export const CONDITION_MULTIPLIERS: Record<ProductCondition, number> = {
  new: 0.85,
  excellent: 0.75,
  good: 0.65,
  fair: 0.5,
  poor: 0.35,
};

// =====================================================
// UPLOAD STATE TYPES
// =====================================================

export interface UploadState {
  stage: UploadStage;
  currentPhase: ProcessingPhase;
  progress: number;
  statusMessage: string;
  analysisResult: ProductAnalysis | null;
  msrpData: MSRPData | null;
  specificationsData: ProductSpecifications | null;
  competitiveData: CompetitiveData | null;
  pricingSuggestion: PricingSuggestion | null;
  seoData: SEOData | null;
  selectedCondition: ProductCondition;
  conditionInspection: ConditionInspection;
  customPrice: string;
  selectedPlatforms: string[];
  productStatus: ProductStatus;
  productId?: string; // Track the created product ID
  imageUrls?: string[]; // Track uploaded image URLs
}

// =====================================================
// PUBLISHING TYPES
// =====================================================

export type PublishingPlatform = "wordpress" | "ebay" | "facebook" | "google";

export interface PublishingPlatformConfig {
  id: PublishingPlatform;
  name: string;
  icon: string;
  description: string;
}

export type ProductStatus = "draft" | "pending" | "private" | "publish";

export interface WordPressPublishData {
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  images: string[]; // Base64 encoded images
  categories: string[];
  tags: string[];
  sku?: string;
  stockQuantity?: number;
  condition: string;
  brand: string;
  specifications: Record<string, string>;
}

export interface PublishResponse {
  success: boolean;
  productId?: string;
  productUrl?: string;
  error?: string;
  platform: string;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export type ProductPipelineStatus =
  | "uploading"
  | "processing"
  | "paused"
  | "completed"
  | "error"
  | "published";

export interface DashboardStats {
  totalProducts: number;
  totalProcessing: number;
  totalPaused: number;
  totalError: number;
  totalCompleted: number;
  totalPublished: number;
}

export interface ProductItem {
  id: string;
  name: string;
  model: string;
  status: ProductPipelineStatus;
  currentPhase: ProcessingPhase;
  progress: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  error?: string;
  price?: number;
  platforms?: string[];
  brand?: string;
  category?: string;
  
  // Additional analysis data
  analysisData?: {
    confidence?: number;
    condition?: string;
    conditionDetails?: string;
    detectedCategories?: string[];
    detectedBrands?: string[];
    imageQualityScore?: number;
    completenessScore?: number;
  };
  
  // Market research data
  marketData?: {
    averagePrice?: number;
    priceRange?: {
      min?: number;
      max?: number;
    };
    marketDemand?: string;
    competitorCount?: number;
    trendingScore?: number;
    amazonPrice?: number;
    amazonUrl?: string;
    ebayPrice?: number;
    ebayUrl?: string;
  };
  
  // SEO analysis data
  seoData?: {
    title?: string;
    metaDescription?: string;
    urlSlug?: string;
    keywords?: string[];
    tags?: string[];
    seoScore?: number;
    searchVolume?: number;
    keywordDifficulty?: number;
  };
  
  // Product listings
  listings?: Array<{
    id: string;
    platform: string;
    title?: string;
    description?: string;
    price?: number;
    status?: string;
    publishedUrl?: string;
    views?: number;
    watchers?: number;
  }>;
}

export interface DashboardFilters {
  status: ProductPipelineStatus | "all";
  search: string;
  page: number;
  itemsPerPage: number;
}

// =====================================================
// UI COMPONENT TYPES
// =====================================================

export interface PhaseStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Called when publish is successful
  files: File[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// LEGACY COMPATIBILITY (Deprecated - Use StreamingData)
// =====================================================

// @deprecated Use StreamingData union type instead
export interface LegacyStreamingData {
  type:
    | "progress"
    | "status"
    | "analysis"
    | "msrp"
    | "specifications"
    | "competitive"
    | "complete"
    | "error";
  value?: number;
  message?: string;
  result?: unknown;
}