"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WooCommercePreview from "@/components/woocommerce-preview";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function WooCommercePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to parse dimensions from JSON string
  const parseDimensions = (dimensionsData: any) => {
    let parsedDimensions = {
      width: 0,
      height: 0,
      length: 0,
      weight: 0
    };

    try {
      // Try to parse from multiple possible sources
      let dimensionsObj = null;
      
      // Check if it's already an object
      if (typeof dimensionsData === 'object' && dimensionsData !== null) {
        dimensionsObj = dimensionsData;
      }
      // Check if it's a JSON string
      else if (typeof dimensionsData === 'string' && dimensionsData !== 'Unknown') {
        try {
          dimensionsObj = JSON.parse(dimensionsData);
        } catch {
          // If JSON parsing fails, return zeros
          return parsedDimensions;
        }
      }

      if (dimensionsObj) {
        // Extract numeric values from strings like "11.20 inches" or "89.60 oz"
        const extractNumber = (value: string | number) => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const match = value.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : 0;
          }
          return 0;
        };

        // Parse width, height, length (keep in inches)
        if (dimensionsObj.width) parsedDimensions.width = extractNumber(dimensionsObj.width);
        if (dimensionsObj.height) parsedDimensions.height = extractNumber(dimensionsObj.height);
        if (dimensionsObj.length) parsedDimensions.length = extractNumber(dimensionsObj.length);
        
        // Parse weight and convert oz to lbs if needed
        if (dimensionsObj.weight) {
          const weightValue = extractNumber(dimensionsObj.weight);
          const weightStr = dimensionsObj.weight.toString().toLowerCase();
          
          // Convert oz to lbs (1 lb = 16 oz)
          if (weightStr.includes('oz')) {
            parsedDimensions.weight = weightValue / 16;
          } else {
            // Assume it's already in lbs
            parsedDimensions.weight = weightValue;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing dimensions:', error);
    }

    return parsedDimensions;
  };

  // Function to transform merged data to WooCommerce preview format
  const transformToWooCommerceData = (mergedData: any, realtimeProduct: any) => {
    if (!mergedData || !realtimeProduct) {
      return {
        id: '',
        name: 'Loading...',
        model: '',
        brand: '',
        category: '',
        description: '',
        product_description: '',
        msrp: 0,
        competitive_price: 0,
        amazon_price: 0,
        ebay_price: 0,
        weight_lbs: 0,
        width_inches: 0,
        height_inches: 0,
        depth_inches: 0,
        seo_title: '',
        meta_description: '',
        url_slug: '',
        keywords: [],
        item_condition: 'good',
        condition_details: '',
        key_features: [],
        technical_specs: {},
        market_demand: 'unknown',
        competitor_count: 0,
        trending_score: 0,
        upc: '',
        item_number: '',
        product_images: []
      };
    }

    // Parse dimensions from both possible sources
    const productDimensions = parseDimensions(mergedData.productInfo?.dimensions);
    const marketDimensions = parseDimensions(mergedData.marketResearch?.dimensions);
    
    // Use market research dimensions as primary, fall back to product dimensions
    const finalDimensions = {
      width: marketDimensions.width || productDimensions.width || 0,
      height: marketDimensions.height || productDimensions.height || 0,
      length: marketDimensions.length || productDimensions.length || 0,
      weight: marketDimensions.weight || productDimensions.weight || 0
    };

    return {
      // Basic product info
      id: realtimeProduct.id,
      name: realtimeProduct.name || mergedData.productInfo?.name || '',
      model: realtimeProduct.model || mergedData.productInfo?.model || '',
      brand: realtimeProduct.brand || mergedData.productInfo?.brand || '',
      category: realtimeProduct.category || mergedData.productInfo?.category || '',
      description: mergedData.productInfo?.description || realtimeProduct.name || '',
      product_description: mergedData.productInfo?.description || '',
      
      // Pricing data from market research
      msrp: mergedData.marketResearch?.msrp || 0,
      competitive_price: mergedData.marketResearch?.competitivePrice || 0,
      amazon_price: mergedData.marketResearch?.amazonPrice || 0,
      ebay_price: mergedData.marketResearch?.ebayPrice || 0,
      
      // Physical specs - parsed from dimensions JSON
      weight_lbs: finalDimensions.weight,
      width_inches: finalDimensions.width,
      height_inches: finalDimensions.height,
      depth_inches: finalDimensions.length, // Using length as depth
      
      // SEO data
      seo_title: mergedData.seoAnalysis?.seoTitle || '',
      meta_description: mergedData.seoAnalysis?.metaDescription || '',
      url_slug: mergedData.seoAnalysis?.urlSlug || '',
      keywords: mergedData.seoAnalysis?.keywords || [],
      
      // Product features and specs
      item_condition: 'good', // Default condition
      condition_details: '',
      key_features: mergedData.productInfo?.keyFeatures || [],
      technical_specs: mergedData.productInfo?.technicalSpecs || {},
      
      // Market data
      market_demand: 'unknown', // Default since not available in current structure
      competitor_count: 0,
      trending_score: 0,
      
      // Identifiers
      upc: mergedData.productInfo?.upc || '',
      item_number: mergedData.productInfo?.id || realtimeProduct.id,
      
      // Images
      product_images: mergedData.images?.map((img: any) => ({
        image_url: img.imageUrl,
        is_primary: img.isPrimary
      })) || []
    };
  };

  // Fetch product data and merged data
  useEffect(() => {
    async function fetchData() {
      if (!productId) return;

      try {
        setIsLoading(true);
        
        // Fetch product details
        const productResponse = await fetch(`/api/dashboard/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product details');
        }
        const productDetails = await productResponse.json();

        // Fetch merged data
        const mergedResponse = await fetch(`/api/products/${productId}/merged-data`);
        if (!mergedResponse.ok) {
          throw new Error('Failed to fetch merged data');
        }
        
        const mergedResult = await mergedResponse.json();
        if (!mergedResult.success) {
          throw new Error(mergedResult.error || 'Failed to fetch merged data');
        }

        // Transform the data for WooCommerce preview
        const transformedData = transformToWooCommerceData(mergedResult.data, productDetails);
        setProductData(transformedData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        toast.error('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  const handleBack = () => {
    router.back();
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pipeline
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">WooCommerce Product Preview</h1>
            <p className="text-muted-foreground">
              Preview how your product will appear in WooCommerce
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading WooCommerce preview...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Preview</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                Back to Pipeline
              </Button>
            </CardContent>
          </Card>
        )}

        {/* WooCommerce Preview */}
        {!isLoading && !error && productData && (
          <WooCommercePreview productData={productData} />
        )}
      </div>
    </MainLayout>
  );
} 