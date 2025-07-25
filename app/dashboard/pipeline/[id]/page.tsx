"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProductDetails } from "@/lib/supabase/hooks";
import { MainLayout } from "@/components/main-layout";
import { PipelineStepper } from "@/components/pipeline-stepper";
import {
  Phase1Form,
  ProductAnalysisData,
} from "@/components/pipeline/phase1-form";
import {
  Phase2Form,
  MarketResearchData,
} from "@/components/pipeline/phase2-form";
import { Phase3Form, SEOAnalysisData } from "@/components/pipeline/phase3-form";
import {
  Phase4Form,
  ProductListingData,
} from "@/components/pipeline/phase4-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Eye, Database, Search, Upload, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { PhaseStatus } from "@/types/pipeline";

// Pipeline steps configuration
const PIPELINE_STEPS = [
  {
    id: 1,
    title: "Product Analysis",
    subtitle: "AI identification",
    icon: Eye,
  },
  {
    id: 2,
    title: "Market Research",
    subtitle: "Pricing & specs",
    icon: Database,
  },
  {
    id: 3,
    title: "SEO Analysis",
    subtitle: "Content optimization",
    icon: Search,
  },
  {
    id: 4,
    title: "Product Listing",
    subtitle: "Publish channels",
    icon: Upload,
  },
];

// Phase completion status
interface PhaseState {
  status: PhaseStatus;
  isRunning: boolean;
}

// Interface for product data from API
interface ProductDetail {
  id: string;
  name: string;
  model: string;
  brand?: string;
  category?: string;
  status: string;
  currentPhase: number;
  createdAt: string;
  updatedAt: string;
  images: any[];
  analysisData: any;
  marketData: any;
  seoData: any;
  listings: any[];
  phases: any[];
  logs: any[];
}

// Function to fetch market research data from API
const _fetchMarketResearchData = async (productId: string) => {
  try {
    console.log('Fetching market research data for product:', productId);
    
    const response = await fetch(`/api/market-research-data?productId=${productId}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    console.log('✅ Market research data fetched successfully:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error fetching market research data:', error);
    return initialMarketResearchData;
  }
};

// Default initial data (will be replaced by API data)
const initialMarketResearchData: MarketResearchData = {
  marketResearch: {
    amazonPrice: 0,
    amazonLink: "",
    ebayPrice: 0,
    ebayLink: "",
    msrp: 0,
    competitivePrice: 0,
  },
  specifications: {
    brand: "Unknown",
    category: "General",
    year: "Unknown",
    height: "Unknown",
    width: "Unknown",
    length: "Unknown",
    weight: "Unknown",
    dimensions: "Unknown",
  },
};

const initialSEOAnalysisData: SEOAnalysisData = {
  seoTitle: "",
  urlSlug: "",
  metaDescription: "",
  keywords: [],
  tags: [],
};

const initialProductListingData: ProductListingData = {
  images: [],
  productTitle: "",
  price: 0,
  publishingStatus: "draft",
  brand: "Unknown",
  category: "General",
  itemCondition: "good",
  productDescription: "",
  keyFeatures: [],
  technicalSpecs: {},
  channels: {
    wordpress: false,
    facebook: false,
    ebay: false,
    amazon: false,
  },
};

export default function ProcessingPipeline() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // Use real-time product details hook
  const { 
    product: realtimeProduct, 
    phases: realtimePhases, 
    logs: realtimeLogs, 
    loading: isLoading, 
    error 
  } = useProductDetails(productId);

  // Legacy product state (keep for backward compatibility)
  const [product, setProduct] = useState<ProductDetail | null>(null);



  // Pipeline state - Always start at Phase 1 (Product Analysis)
  const [currentStep, setCurrentStep] = useState(1);
  const [phaseStates, setPhaseStates] = useState<Record<number, PhaseState>>({
    1: { status: "completed", isRunning: false },
    2: { status: "pending", isRunning: false },
    3: { status: "pending", isRunning: false },
    4: { status: "pending", isRunning: false },
  });

  // Phase data states (will be populated from API)
  const [productAnalysisData, setProductAnalysisData] = useState<ProductAnalysisData>({
    productName: "",
    model: "",
    confidence: 0,
    itemCondition: "good",
    conditionDetails: "",
  });
  const [marketResearchData, setMarketResearchData] =
    useState<MarketResearchData>(initialMarketResearchData);
  const [seoAnalysisData, setSEOAnalysisData] = useState<SEOAnalysisData>(
    initialSEOAnalysisData
  );
  const [productListingData, setProductListingData] =
    useState<ProductListingData>(initialProductListingData);

  // State for merged product data
  const [mergedData, setMergedData] = useState<any>(null);



  // Fetch merged data from all tables when component mounts AND when product updates
  useEffect(() => {
    if (productId) {
      fetchMergedProductData(productId);
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch merged data when real-time product updates (for market research data)
  useEffect(() => {
    if (realtimeProduct && productId) {
      // Refetch merged data when product status or current phase changes
      console.log('🔄 [PIPELINE] Product updated, refetching merged data...');
      fetchMergedProductData(productId);
    }
  }, [realtimeProduct?.updated_at, realtimeProduct?.current_phase, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to fetch merged data from the API
  const fetchMergedProductData = async (productId: string) => {
    try {
      console.log('🔍 Fetching merged data for product:', productId);
      
      // Add timestamp to prevent caching of stale data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products/${productId}/merged-data?t=${timestamp}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }
      
      console.log('✅ Merged data fetched successfully:', result.data);
      setMergedData(result.data);
      
      // Update individual phase data states with organized information
      updatePhaseDataFromMergedData(result.data);
      
    } catch (error) {
      console.error('❌ Error fetching merged data:', error);
      toast.error('Failed to load product data');
    }
  };

  // Function to organize merged data into phase-specific data structures
  const updatePhaseDataFromMergedData = (data: any) => {
    if (!data) return;

    // Phase 1: Product Analysis - Basic product info
    setProductAnalysisData({
      productName: data.productInfo.name || "",
      model: data.productInfo.model || "",
      confidence: data.productInfo.aiConfidence || 85,
      itemCondition: "good",
      conditionDetails: data.productInfo.description || "Product analyzed and in good condition",
      images: data.images || [],
    });

    // Phase 2: Market Research - Show brand info from products table + market research data
    setMarketResearchData({
      marketResearch: {
        amazonPrice: data.marketResearch?.amazonPrice || 0,
        amazonLink: data.marketResearch?.amazonLink || "",
        ebayPrice: data.marketResearch?.ebayPrice || 0,
        ebayLink: data.marketResearch?.ebayLink || "",
        msrp: data.marketResearch?.msrp || 0,
        competitivePrice: data.marketResearch?.competitivePrice || 0,
      },
      specifications: {
        // Show brand and category from products table in market research phase
        brand: data.productInfo.brand || data.marketResearch?.brand || "Unknown",
        category: data.productInfo.category || data.marketResearch?.category || "General", 
        year: data.productInfo.yearReleased || data.marketResearch?.year || "Unknown",
        height: data.marketResearch?.height || data.productInfo.height || "Unknown",
        width: data.marketResearch?.width || data.productInfo.width || "Unknown",
        length: data.marketResearch?.length || data.productInfo.length || "Unknown",
        weight: data.marketResearch?.weight || "Unknown",
        dimensions: data.marketResearch?.dimensions || 
                   (data.productInfo.dimensions ? JSON.stringify(data.productInfo.dimensions) : "Unknown"),
        // ✅ FIXED: Add technical specs from products table
        technical_specs: data.productInfo.technicalSpecs || {},
      },
    });

    // Phase 3: SEO Analysis - Combine SEO data with product info
    if (data.seoAnalysis) {
      setSEOAnalysisData({
        seoTitle: data.seoAnalysis.seoTitle || `${data.productInfo.brand} ${data.productInfo.model}`,
        urlSlug: data.seoAnalysis.urlSlug || `${data.productInfo.brand}-${data.productInfo.model}`.toLowerCase().replace(/\s+/g, '-'),
        metaDescription: data.seoAnalysis.metaDescription || data.productInfo.description || "",
        keywords: data.seoAnalysis.keywords || [data.productInfo.brand, data.productInfo.category].filter(Boolean),
        tags: data.seoAnalysis.tags || [],
      });
    }

    // Phase 4: Product Listing - Use saved product listing data if available, otherwise fallback to combined data
    console.log('🔄 [DASHBOARD] Setting Phase 4 data. Product listing data available:', !!data.productListing);
    if (data.productListing) {
      console.log('📋 [DASHBOARD] Using saved product listing data:', data.productListing);
    }
    
    setProductListingData({
      images: data.images || [], // Use images from merged data
      productTitle: data.productListing?.productTitle || 
                   data.seoAnalysis?.seoTitle || 
                   `${data.productInfo.brand} ${data.productInfo.model}`,
      price: data.productListing?.price || 
             data.marketResearch?.competitivePrice || 
             data.marketResearch?.msrp || 0,
      publishingStatus: data.productListing?.publishingStatus || "draft",
      brand: data.productListing?.brand || 
             data.productInfo.brand || "Unknown",
      category: data.productListing?.category || 
               data.productInfo.category || "General",
      itemCondition: data.productListing?.itemCondition || "good",
      productDescription: data.productListing?.productDescription || 
                         data.productInfo.description || 
                         `${data.productInfo.brand} ${data.productInfo.model} in excellent condition`,
      keyFeatures: data.productListing?.keyFeatures || 
                  data.productInfo.keyFeatures || [],
             // ✅ FIXED: Add technical specs from products table - prioritize updated specs
       technicalSpecs: (() => {
         const specs = data.productInfo.technicalSpecs || {};
         console.log('🔧 [DASHBOARD] Setting technicalSpecs for Phase 4:', specs);
         return specs;
       })(),
      channels: data.productListing?.channels || {
        wordpress: false,
        facebook: false,
        ebay: false,
        amazon: false,
      },
    });
  };

  // Update component state when real-time data changes
  useEffect(() => {
    if (realtimeProduct) {
      // Convert real-time product to legacy format for compatibility
      const productData: ProductDetail = {
        id: realtimeProduct.id,
        name: realtimeProduct.name || "",
        model: realtimeProduct.model || "",
        brand: realtimeProduct.brand || undefined,
        category: realtimeProduct.category || undefined,
        status: realtimeProduct.status,
        currentPhase: realtimeProduct.current_phase,
        createdAt: realtimeProduct.created_at,
        updatedAt: realtimeProduct.updated_at,
        images: [],
        analysisData: {
          productName: realtimeProduct.name,
          model: realtimeProduct.model,
          confidence: realtimeProduct.ai_confidence || 85,
          itemCondition: "good",
          conditionDetails: "Product analyzed and in good condition"
        },
        marketData: null, // Will be populated from merged data API
        seoData: null,
        listings: [],
        phases: realtimePhases || [],
        logs: realtimeLogs || []
      };
      
      setProduct(productData);

      // Update pipeline states based on real-time phases
      if (realtimePhases && realtimePhases.length > 0) {
        const newPhaseStates: Record<number, PhaseState> = {};
        realtimePhases.forEach((phase) => {
          newPhaseStates[phase.phase_number] = {
            status: phase.status as PhaseStatus,
            isRunning: phase.status === 'running'
          };
        });
        setPhaseStates(newPhaseStates);
      }

      // Always start at Phase 1 (Product Analysis) when viewing a product
      // This allows users to review all phases regardless of current progress
      console.log(`🔍 Product ${realtimeProduct.id} is at phase ${realtimeProduct.current_phase}, but starting view at Phase 1`);
      setCurrentStep(1);

      // Set basic analysis data
      setProductAnalysisData({
        productName: realtimeProduct.name || "",
        model: realtimeProduct.model || "",
        confidence: realtimeProduct.ai_confidence || 85,
        itemCondition: "good",
        conditionDetails: "Product analyzed and in good condition",
      });
    }
  }, [realtimeProduct, realtimePhases]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation handlers
  const handleStepClick = (stepId: number) => {
    // Allow free navigation between phases for review purposes
    // Users can view any phase regardless of completion status
    console.log(`📍 Navigating to Phase ${stepId}`);
    setCurrentStep(stepId);
  };

  const handlePhaseStart = (phaseId: number) => {
    setPhaseStates((prev) => ({
      ...prev,
      [phaseId]: { status: "running", isRunning: true },
    }));
    toast.info(`Starting Phase ${phaseId}...`);
  };

  const handlePhaseStop = (phaseId: number) => {
    setPhaseStates((prev) => ({
      ...prev,
      [phaseId]: { status: "pending", isRunning: false },
    }));
    toast.info(`Phase ${phaseId} stopped`);
  };

  const handlePhaseRestart = (phaseId: number) => {
    setPhaseStates((prev) => ({
      ...prev,
      [phaseId]: { status: "running", isRunning: true },
    }));
    toast.info(`Restarting Phase ${phaseId}...`);
  };

  const handlePhaseComplete = (phaseId: number) => {
    setPhaseStates((prev) => ({
      ...prev,
      [phaseId]: { status: "completed", isRunning: false },
    }));
    toast.success(`Phase ${phaseId} completed successfully!`);
  };

  const handleNext = () => {
    if (currentStep < PIPELINE_STEPS.length) {
      handlePhaseComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    // Refetch merged data after saving to get updated values
    if (productId) {
      console.log('🔄 [DASHBOARD] Refetching merged data after save...');
      await fetchMergedProductData(productId);
    }
    toast.success("Progress saved successfully!");
  };

  const handlePublish = () => {
    const selectedChannels = Object.entries(productListingData.channels)
      .filter(([, enabled]) => enabled)
      .map(([channel]) => channel);

    if (selectedChannels.length === 0) {
      toast.error("Please select at least one publishing channel");
      return;
    }

    handlePhaseComplete(4);
    toast.success(`Publishing to ${selectedChannels.length} channel(s)...`);
    // Handle publishing logic here
  };

  // Check if current phase can be started
  const canStartPhase = (phaseId: number) => {
    if (phaseId === 1) return true;
    return phaseStates[phaseId - 1].status === "completed";
  };

  // Render current phase form
  const renderCurrentPhase = () => {
    const currentPhaseState = phaseStates[currentStep];

    const commonProps = {
      phaseState: currentPhaseState,
      onStart: () => handlePhaseStart(currentStep),
      onStop: () => handlePhaseStop(currentStep),
      onRestart: () => handlePhaseRestart(currentStep),
      canStart: canStartPhase(currentStep),
    };

    switch (currentStep) {
      case 1:
        return (
          <Phase1Form
            data={productAnalysisData}
            onUpdate={setProductAnalysisData}
            onSave={handleSave}
            onNext={handleNext}
            {...commonProps}
          />
        );
      case 2:
        return (
          <Phase2Form
            data={marketResearchData}
            onUpdate={setMarketResearchData}
            onSave={handleSave}
            onNext={handleNext}
            onPrevious={handlePrevious}
            {...commonProps}
          />
        );
      case 3:
        return (
          <Phase3Form
            data={seoAnalysisData}
            onUpdate={setSEOAnalysisData}
            onSave={handleSave}
            onNext={handleNext}
            onPrevious={handlePrevious}
            {...commonProps}
          />
        );
      case 4:
        return (
          <Phase4Form
            data={productListingData}
            onUpdate={setProductListingData}
            onSave={handleSave}
            onPrevious={handlePrevious}
            onPublish={handlePublish}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Loading..." : product?.name || "Product Not Found"}
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? "Loading details..." : product?.model || "Model Unknown"}
            </p>
          </div>
          
          {/* WooCommerce Preview Button */}
          {!isLoading && !error && mergedData && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.push(`/dashboard/pipeline/${productId}/woocommerce-preview`)}
            >
              <ShoppingCart className="h-4 w-4" />
              WooCommerce Preview
            </Button>
          )}
        </div>

        {/* Product Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">Step {currentStep}/4</Badge>
                  <span className="text-sm text-muted-foreground">
                    {PIPELINE_STEPS[currentStep - 1]?.title}
                  </span>
                  <Badge
                    variant={
                      phaseStates[currentStep].status === "completed"
                        ? "default"
                        : phaseStates[currentStep].status === "running"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {phaseStates[currentStep].status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {product?.listings && product.listings.length > 0 ? (
                    product.listings.map((listing: any) => (
                      <Badge key={listing.id} variant="outline" className="text-xs">
                        {listing.platform}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No platforms configured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Stepper */}
        <PipelineStepper
          steps={PIPELINE_STEPS}
          currentStep={currentStep}
          phaseStates={phaseStates}
          onStepClick={handleStepClick}
        />

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading product data...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Product</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.back()} variant="outline">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Phase Form */}
        {!isLoading && !error && product && (
          <div className="min-h-[600px]">{renderCurrentPhase()}</div>
        )}
      </div>
    </MainLayout>
  );
}
