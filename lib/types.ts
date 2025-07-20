// Shared types for the entire application
export type UploadStage = "uploading" | "analyzing" | "validation" | "complete";
export type ProcessingPhase = 1 | 2 | 3 | 4;

// Product Analysis Types
export interface ProductAnalysis {
  model: string;
  confidence: number;
  defects: string[];
}

// MSRP Data Types
export interface MSRPData {
  currentSellingPrice: number;
  originalMSRP: number;
  priceTrend: string;
  currency: string;
  lastUpdated: string;
  sources: string[];
}

// Specifications Types
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

// Competitive Analysis Types
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

// Pricing Types
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

// SEO Types
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

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StreamingData {
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

// UI Component Types
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

// Publishing Types
export type PublishingPlatform = "wordpress" | "ebay" | "facebook" | "google";

export interface PublishingPlatformConfig {
  id: PublishingPlatform;
  name: string;
  icon: string;
  description: string;
}

// Product Condition Types - Updated for manual human inspection
export type ProductCondition = "new" | "excellent" | "good" | "fair" | "poor";

// Item Condition Types - What appears on the website
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

// Human inspection condition data
export interface ConditionInspection {
  itemCondition: ItemCondition;
  productCondition: string; // Human-entered details like "missing button", "scratched on left side"
}

// Condition Multipliers
export const CONDITION_MULTIPLIERS: Record<ProductCondition, number> = {
  new: 0.85,
  excellent: 0.75,
  good: 0.65,
  fair: 0.5,
  poor: 0.35,
};

// WordPress/WooCommerce Publishing Types
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

// Dashboard Types
export type ProductPipelineStatus =
  | "uploading"
  | "processing"
  | "paused"
  | "completed"
  | "error"
  | "published";

export interface DashboardStats {
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
}

export interface DashboardFilters {
  status: ProductPipelineStatus | "all";
  search: string;
  page: number;
  itemsPerPage: number;
}
