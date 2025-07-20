import { Camera, Database, Sparkles, Globe } from "lucide-react";
import { PhaseStep, PublishingPlatformConfig } from "./types";

// Processing phases configuration
export const PROCESSING_PHASES: PhaseStep[] = [
  {
    id: 1,
    title: "Product Recognition",
    subtitle: "AI analyzes your images",
    description: "AI analyzes your images to identify products",
    icon: Camera,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-500/20",
  },
  {
    id: 2,
    title: "Data Enrichment",
    subtitle: "Fetch MSRP & specs",
    description: "Fetch MSRP, specs, and market research",
    icon: Database,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    borderColor: "border-purple-200 dark:border-purple-500/20",
  },
  {
    id: 3,
    title: "Smart Pricing",
    subtitle: "Generate content",
    description: "Generate pricing and product descriptions",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-500/10",
    borderColor: "border-amber-200 dark:border-amber-500/20",
  },
  {
    id: 4,
    title: "SEO & Publishing",
    subtitle: "Optimize for search",
    description: "Optimize for search and prepare for listing",
    icon: Globe,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-500/10",
    borderColor: "border-green-200 dark:border-green-500/20",
  },
];

// Publishing platforms configuration
export const PUBLISHING_PLATFORMS: PublishingPlatformConfig[] = [
  {
    id: "wordpress",
    name: "WordPress",
    icon: "📝",
    description: "WordPress site",
  },
  {
    id: "ebay",
    name: "eBay",
    icon: "🔨",
    description: "Auction & Buy It Now",
  },
  {
    id: "facebook",
    name: "Facebook Marketplace",
    icon: "👥",
    description: "Local & shipping",
  },
  {
    id: "google",
    name: "Google Shopping",
    icon: "🛍️",
    description: "Search ads",
  },
];

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: "/api/upload",
  ENRICH: "/api/enrich",
  PRICING: "/api/pricing",
  SEO: "/api/seo",
  PUBLISH: "/api/publish",
} as const;

// Status messages for each phase
export const PHASE_STATUS_MESSAGES = {
  1: {
    start: "Starting product analysis...",
    progress: "Analyzing product images...",
    complete: "Product recognition completed successfully!",
  },
  2: {
    start: "Starting data enrichment...",
    progress: "Gathering market data and specifications...",
    complete: "Data enrichment completed successfully!",
  },
  3: {
    start: "Calculating intelligent pricing...",
    progress: "Analyzing market competition...",
    complete: "Pricing calculation completed successfully!",
  },
  4: {
    start: "Generating SEO content...",
    progress: "Optimizing for search engines...",
    complete: "SEO optimization completed successfully!",
  },
} as const;

// Form validation rules
export const VALIDATION_RULES = {
  REQUIRED_FIELDS: {
    UPLOAD: ["images"] as string[],
    ENRICH: ["productModel"] as string[],
    PRICING: [
      "productModel",
      "condition",
      "competitiveData",
      "currentSellingPrice",
    ] as string[],
    SEO: [
      "productModel",
      "specifications",
      "msrpData",
      "condition",
      "finalPrice",
    ] as string[],
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ] as string[],
  MAX_FILES: 10,
  MIN_PRICE: 0,
  MAX_PRICE: 999999,
} as const;

// Default fallback values
export const DEFAULT_VALUES = {
  CONDITION: "good" as const,
  CONFIDENCE_THRESHOLD: 80,
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60000,
  },
} as const;

// Product status options for publishing
export const PRODUCT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Review" },
  { value: "private", label: "Private" },
  { value: "publish", label: "Publish" },
] as const;
