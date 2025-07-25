"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Globe, 
  // Sparkles import removed as it's not used 
  DollarSign, 
  Upload, 
  Eye,
  TrendingUp,
  Search,
  Package,
  // Calendar import removed as it's not used
  Ruler,
  Tag,
  Star,
  // BarChart3 and Target imports removed as they're not used
  ExternalLink,
  Info,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEOData,
  ProductSpecifications,
  MSRPData,
  ConditionInspection,
  ITEM_CONDITIONS,
  ProductStatus,
} from "@/lib/types";
import { PUBLISHING_PLATFORMS, PRODUCT_STATUS_OPTIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";

// Database table types
interface ProductData {
  id: string;
  name: string | null;
  model: string | null;
  brand: string | null;
  category: string | null;
  year_released: string | null;
  description: string | null;
  key_features: string[] | null;
  technical_specs: Record<string, any> | null;
  dimensions: Record<string, any> | null;
  model_variations: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProductAnalysisData {
  id: string;
  product_id: string;
  product_name: string | null;
  model: string | null;
  confidence: number;
  item_condition: string | null;
  condition_details: string | null;
  detected_categories: string[] | null;
  detected_brands: string[] | null;
  color_analysis: Record<string, any> | null;
  image_quality_score: number | null;
  completeness_score: number | null;
  created_at: string;
  updated_at: string;
}

interface ProductMarketData {
  id: string;
  product_id: string;
  average_market_price: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  market_demand: string | null;
  competitor_count: number | null;
  trending_score: number | null;
  seasonal_factor: number | null;
  best_selling_platforms: string[] | null;
  recommended_categories: string[] | null;
  data_sources: string[] | null;
  amazon_price: number | null;
  amazon_url: string | null;
  amazon_verified: boolean | null;
  ebay_price: number | null;
  ebay_url: string | null;
  ebay_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface SEOAnalysisData {
  id: string;
  product_id: string;
  seo_title: string | null;
  meta_description: string | null;
  url_slug: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  seo_score: number | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  content_suggestions: string[] | null;
  competitor_analysis: Record<string, any> | null;
  title_length: number | null;
  description_length: number | null;
  keyword_density: number | null;
  readability_score: number | null;
  created_at: string;
  updated_at: string;
}

interface Phase4ResultsProps {
  productListingData: {
    seoData: SEOData;
    specificationsData: ProductSpecifications | null;
    msrpData: MSRPData | null;
    conditionInspection: ConditionInspection;
    customPrice: string;
    selectedPlatforms: string[];
    productStatus: ProductStatus;
    files: File[];
  };
  productId?: string; // Add productId prop
  onPriceChange: (price: string) => void;
  onPlatformToggle: (platformId: string) => void;
  onStatusChange: (status: ProductStatus) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export function Phase4Results({
  productListingData,
  productId,
  onPriceChange,
  onPlatformToggle,
  onStatusChange,
  onPublish,
  onSaveDraft,
}: Phase4ResultsProps) {
  // State for database data
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [analysisData, setAnalysisData] = useState<ProductAnalysisData | null>(null);
  const [marketData, setMarketData] = useState<ProductMarketData | null>(null);
  const [seoData, setSeoData] = useState<SEOAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the productId prop or fallback to demo ID
  const actualProductId = productId || "demo-product-id";

  // Fetch data from all database tables
  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        console.log("🔍 Fetching data for product:", actualProductId);

        // Fetch from all 4 tables in parallel
        const [productsResult, analysisResult, marketResult, seoResult] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('id', actualProductId)
            .single(),
          
          supabase
            .from('product_analysis_data')
            .select('*')
            .eq('product_id', actualProductId)
            .single(),
          
          supabase
            .from('product_market_data')
            .select('*')
            .eq('product_id', actualProductId)
            .single(),
          
          supabase
            .from('seo_analysis_data')
            .select('*')
            .eq('product_id', actualProductId)
            .single()
        ]);

        // Set data (even if some queries fail, we'll show what we have)
        if (productsResult.data) {
          setProductData(productsResult.data as ProductData);
          console.log("✅ Products data loaded:", productsResult.data);
        } else {
          console.log("⚠️ No products data found");
        }

        if (analysisResult.data) {
          setAnalysisData(analysisResult.data as ProductAnalysisData);
          console.log("✅ Analysis data loaded:", analysisResult.data);
        } else {
          console.log("⚠️ No analysis data found");
        }

        if (marketResult.data) {
          setMarketData(marketResult.data as ProductMarketData);
          console.log("✅ Market data loaded:", marketResult.data);
        } else {
          console.log("⚠️ No market data found");
        }

        if (seoResult.data) {
          setSeoData(seoResult.data as SEOAnalysisData);
          console.log("✅ SEO data loaded:", seoResult.data);
        } else {
          console.log("⚠️ No SEO data found");
        }

      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [actualProductId]);

  const _itemConditionLabel =
    ITEM_CONDITIONS.find(
      (condition) => condition.value === (analysisData?.item_condition || productListingData.conditionInspection?.itemCondition)
    )?.label || "Not specified";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading comprehensive product data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error loading data: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">
                Phase 4 Complete - Comprehensive Product Data
              </CardTitle>
              <CardDescription>
                All database tables loaded: {[productData, analysisData, marketData, seoData].filter(Boolean).length}/4 tables
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Product Analysis Data (Phase 1 Results) */}
      {analysisData && (
        <Card className="border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/20">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Product Analysis Results (product_analysis_data)
                </CardTitle>
                <CardDescription>
                  AI-powered product identification and condition assessment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Product Name
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm font-medium">
                    {analysisData.product_name || "Unknown Product"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Model
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {analysisData.model || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  AI Confidence
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Progress value={analysisData.confidence} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{analysisData.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Image Quality Score
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {analysisData.image_quality_score || "N/A"}/100
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Item Condition
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <Badge variant="outline" className="text-sm">
                    {analysisData.item_condition || "Unknown"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Condition Details
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {analysisData.condition_details || "No specific details provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Detected Categories and Brands */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Detected Categories
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {analysisData.detected_categories?.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">None detected</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Detected Brands
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {analysisData.detected_brands?.map((brand, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {brand}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">None detected</span>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Specifications (From Products Table) */}
      {productData && (
        <Card className="border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-500/20">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100">
                  Product Information (products table)
                </CardTitle>
                <CardDescription>
                  Core product data and specifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Name
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm font-medium">
                    {productData.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Brand
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {productData.brand || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Category
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {productData.category || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Year Released
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">
                    {productData.year_released || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            {productData.dimensions && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensions
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(productData.dimensions).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-xs text-muted-foreground capitalize">{key}</p>
                        <p className="text-sm font-medium">{value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Key Features */}
            {productData.key_features && productData.key_features.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Key Features
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {productData.key_features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {productData.technical_specs && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Technical Specifications
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(productData.technical_specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{key}:</span>
                        <span className="text-sm text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Model Variations */}
            {productData.model_variations && productData.model_variations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Model Variations
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {productData.model_variations.map((variation, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {variation}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {productData.description && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Product Description
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <p className="text-sm leading-relaxed">{productData.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Research Data (Phase 2 Results) */}
      {marketData && (
        <Card className="border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  Market Research Data (product_market_data)
                </CardTitle>
                <CardDescription>
                  Pricing analysis and market intelligence from Phase 2
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Average Market Price
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    ${marketData.average_market_price || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Price Range
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm font-medium">
                    ${marketData.price_range_min || "N/A"} - ${marketData.price_range_max || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Market Demand
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <Badge 
                    variant={marketData.market_demand === 'high' ? 'default' : 
                             marketData.market_demand === 'low' ? 'destructive' : 'secondary'}
                    className="text-sm capitalize"
                  >
                    {marketData.market_demand || "Unknown"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Trending Score
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Progress value={marketData.trending_score || 0} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{marketData.trending_score || 0}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Amazon Data
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="text-sm font-medium">${marketData.amazon_price || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Verified:</span>
                      <Badge variant={marketData.amazon_verified ? "default" : "secondary"} className="text-xs">
                        {marketData.amazon_verified ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {marketData.amazon_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <ExternalLink className="h-3 w-3" />
                        <a 
                          href={marketData.amazon_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate"
                        >
                          View on Amazon
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  eBay Data
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="text-sm font-medium">${marketData.ebay_price || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Verified:</span>
                      <Badge variant={marketData.ebay_verified ? "default" : "secondary"} className="text-xs">
                        {marketData.ebay_verified ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {marketData.ebay_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <ExternalLink className="h-3 w-3" />
                        <a 
                          href={marketData.ebay_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate"
                        >
                          View on eBay
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Market Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Competitor Count
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border text-center">
                  <p className="text-lg font-bold">{marketData.competitor_count || 0}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Seasonal Factor
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border text-center">
                  <p className="text-lg font-bold">{marketData.seasonal_factor || "1.0"}x</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Data Sources
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex flex-wrap gap-1">
                    {marketData.data_sources?.map((source, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Analysis Data (Phase 4 Results) */}
      {seoData && (
        <Card className="border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-500/20">
                <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  SEO Analysis Results (seo_analysis_data)
                </CardTitle>
                <CardDescription>
                  Search engine optimization and content analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SEO Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  SEO Score
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Progress value={seoData.seo_score || 0} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{seoData.seo_score || 0}/100</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Search Volume
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {seoData.search_volume || 0}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Keyword Difficulty
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <Progress value={seoData.keyword_difficulty || 0} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{seoData.keyword_difficulty || 0}/100</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Readability Score
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {seoData.readability_score || 0}/100
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Title and Meta */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  SEO Title ({seoData.title_length || 0} characters)
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm font-medium">{seoData.seo_title || "No title generated"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Meta Description ({seoData.description_length || 0} characters)
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm">{seoData.meta_description || "No description generated"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  URL Slug
                </Label>
                <div className="bg-white dark:bg-white/5 p-3 rounded border">
                  <p className="text-sm font-mono">{seoData.url_slug || "no-slug-generated"}</p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                SEO Keywords (Density: {seoData.keyword_density || 0}%)
              </Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <div className="flex flex-wrap gap-2">
                  {seoData.keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">No keywords generated</span>}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                Content Tags
              </Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <div className="flex flex-wrap gap-2">
                  {seoData.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">No tags generated</span>}
                </div>
              </div>
            </div>

            {/* Content Suggestions */}
            {seoData.content_suggestions && seoData.content_suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Content Suggestions
                </Label>
                <div className="bg-white dark:bg-white/5 p-4 rounded border">
                  <ul className="space-y-2">
                    {seoData.content_suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                Pricing Strategy
              </CardTitle>
              <CardDescription>
                Competitive pricing analysis and recommendations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Your Price
              </Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={productListingData.customPrice}
                    onChange={(e) => onPriceChange(e.target.value)}
                    className="pl-10 text-lg font-bold text-center"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Market Average
              </Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  ${marketData?.average_market_price || "N/A"}
                </p>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Customer Savings
              </Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <p className="text-lg font-bold text-green-600">
                  $
                  {marketData?.average_market_price
                    ? (
                        marketData.average_market_price -
                        parseFloat(productListingData.customPrice || "0")
                      ).toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card className="border-slate-200 dark:border-slate-500/20 bg-slate-50/50 dark:bg-slate-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-500/20">
              <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Product Images
              </CardTitle>
              <CardDescription>
                High-quality images for your listing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productListingData.files.map((file, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Product ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index === 0 ? "Primary" : index + 1}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Controls */}
      <Card className="border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">
                Publishing Options
              </CardTitle>
              <CardDescription>
                Choose platforms and publishing status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Publishing Status */}
          <div className="space-y-2">
            <Label htmlFor="productStatus" className="text-sm font-medium">
              Publishing Status
            </Label>
            <Select
              value={productListingData.productStatus}
              onValueChange={onStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Publishing Platforms */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Publishing Platforms</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PUBLISHING_PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all hover:border-primary",
                    productListingData.selectedPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                  onClick={() => onPlatformToggle(platform.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border rounded flex items-center justify-center">
                      {productListingData.selectedPlatforms.includes(platform.id) && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {platform.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onPublish}
              className="flex-1"
              disabled={productListingData.selectedPlatforms.length === 0}
            >
              <Globe className="h-4 w-4 mr-2" />
              Publish to Selected Platforms
            </Button>
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="flex-1"
            >
              Save as Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="border-gray-200 dark:border-gray-500/20 bg-gray-50/50 dark:bg-gray-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Database Tables Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <Badge variant={productData ? "default" : "destructive"}>
                Products: {productData ? "✓" : "✗"}
              </Badge>
            </div>
            <div>
              <Badge variant={analysisData ? "default" : "destructive"}>
                Analysis: {analysisData ? "✓" : "✗"}
              </Badge>
            </div>
            <div>
              <Badge variant={marketData ? "default" : "destructive"}>
                Market: {marketData ? "✓" : "✗"}
              </Badge>
            </div>
            <div>
              <Badge variant={seoData ? "default" : "destructive"}>
                SEO: {seoData ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
