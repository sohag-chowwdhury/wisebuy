// lib/types.ts - Complete types for the entire application

// =====================================================
// CORE UPLOAD AND PROCESSING TYPES
// =====================================================

export type UploadStage = "uploading" | "analyzing" | "validation" | "complete";
export type ProcessingPhase = 1 | 2 | 3 | 4;

// =====================================================
// COMPREHENSIVE ECOMMERCE ANALYSIS TYPES (NEW)
// =====================================================

export interface BasicInformation {
  brand: string;
  model_number: string;
  manufacturer: string;
  product_name: string;
  upc: string;
  item_number: string;
}

export interface ProductSpecifications_Comprehensive {
  height_inches: number | null;
  height_cm: number | null;
  width_inches: number | null;
  width_cm: number | null;
  depth_inches: number | null;
  depth_cm: number | null;
  weight_lbs: number | null;
  weight_kg: number | null;
  weight_source: string;
}

export interface PowerRequirements {
  voltage: string;
  wattage: string;
  bulb_type: string;
  number_of_bulbs: number | null;
  led_compatible: boolean | null;
}

export interface ElectricalSpecs {
  cord_length: string;
  ul_listed: boolean | null;
  etl_listed: boolean | null;
  csa_listed: boolean | null;
}

export interface AssemblyInfo {
  tools_required: boolean | null;
  estimated_assembly_time: string;
  difficulty_level: string;
}

export interface MaterialSpecs {
  primary_material: string;
  finish: string;
  shade_material: string;
}

export interface TechnicalDetails {
  power_requirements: PowerRequirements;
  electrical_specs: ElectricalSpecs;
  assembly: AssemblyInfo;
  materials: MaterialSpecs;
  features: string[];
}

export interface ComplianceAndSafety {
  country_of_origin: string;
  prop_65_warning: boolean | null;
  safety_certifications: string[];
  warranty_terms: string;
}

export interface WebsitesAndDocumentation {
  official_product_page: string;
  instruction_manual: string;
  additional_resources: string[];
}

export interface AmazonPricing {
  price: number | null;
  prime_available: boolean | null;
  seller_type: string;
  rating: number | null;
  review_count: number | null;
  url: string;
  search_results_url: string;
}

export interface EbayPricing_Comprehensive {
  new_price_range: {
    min: number | null;
    max: number | null;
  };
  used_price_range: {
    min: number | null;  
    max: number | null;
  };
  recent_sold_average: number | null;
  url: string;
  search_results_url: string;
  sold_listings_url: string;
}

export interface OtherRetailer {
  retailer: string;
  price: number | null;
  url: string;
  availability: string;
}

export interface ComprehensiveCompetitivePricing {
  amazon: AmazonPricing;
  ebay: EbayPricing_Comprehensive;
  other_retailers: OtherRetailer[];
}

export interface MarketAnalysis {
  target_demographics: string[];
  seasonal_demand: string;
  complementary_products: string[];
  key_selling_points: string[];
}

export interface LogisticsAssessment {
  package_condition: string;
  fragility_level: string;
  shipping_considerations: string;
  storage_requirements: string;
  return_policy_implications: string;
}

export interface VisualContentNeeds {
  additional_photos_needed: string[];
  lifestyle_shots_required: boolean | null;
  detail_shots_required: boolean | null;
}

export interface PricingRecommendation {
  msrp: number | null;
  suggested_price_range: {
    min: number | null;
    max: number | null;
  };
  justification: string;
  profit_margin_estimate: string;
}

export interface AnalysisMetadata {
  analysis_date: string;
  analyst_notes: string;
  data_confidence_level: string;
  missing_information: string[];
}

export interface ComprehensiveProductAnalysis {
  basic_information: BasicInformation;
  specifications: ProductSpecifications_Comprehensive;
  product_description: string;
  technical_details: TechnicalDetails;
  compliance_and_safety: ComplianceAndSafety;
  websites_and_documentation: WebsitesAndDocumentation;
  competitive_pricing: ComprehensiveCompetitivePricing;
  market_analysis: MarketAnalysis;
  logistics_assessment: LogisticsAssessment;
  visual_content_needs: VisualContentNeeds;
  pricing_recommendation: PricingRecommendation;
  analysis_metadata: AnalysisMetadata;
}

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

export interface ComprehensiveAnalysisData {
  type: "comprehensive";
  result: ComprehensiveProductAnalysis;
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
  | ComprehensiveAnalysisData
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

export function isComprehensiveAnalysisData(data: StreamingData): data is ComprehensiveAnalysisData {
  return data.type === "comprehensive";
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