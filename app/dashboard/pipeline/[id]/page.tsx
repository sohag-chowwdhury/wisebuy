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
import { ArrowLeft, Eye, Database, Search, Upload } from "lucide-react";
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

// Default initial data (will be replaced by API data)
const initialMarketResearchData: MarketResearchData = {
  marketResearch: {
    amazonPrice: 0,
    amazonLink: "",
    msrp: 0,
    competitivePrice: 0,
  },
  specifications: {
    brand: "Unknown",
    category: "General",
    year: "Unknown",
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

  // Pipeline state
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

  // Update component state when real-time data changes
  useEffect(() => {
    if (realtimeProduct) {
      // Convert real-time product to legacy format for compatibility
      const productData = {
        ...realtimeProduct,
        currentPhase: realtimeProduct.current_phase,
        analysisData: {
          productName: realtimeProduct.name,
          model: realtimeProduct.model,
          confidence: realtimeProduct.ai_confidence || 85,
          itemCondition: "good",
          conditionDetails: "Product analyzed and in good condition"
        },
        marketData: null, // Will be populated from separate API if needed
        seoData: null,
        images: [],
        listings: []
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

      // Update current step
      if (realtimeProduct.current_phase) {
        setCurrentStep(realtimeProduct.current_phase);
      }

      // Set basic analysis data
      setProductAnalysisData({
        productName: realtimeProduct.name || "",
        model: realtimeProduct.model || "",
        confidence: realtimeProduct.ai_confidence || 85,
        itemCondition: "good",
        conditionDetails: "Product analyzed and in good condition",
      });
    }
  }, [realtimeProduct, realtimePhases]);

  // Navigation handlers
  const handleStepClick = (stepId: number) => {
    // Check if previous step is completed
    if (stepId > 1 && phaseStates[stepId - 1].status !== "completed") {
      toast.error(`Please complete Step ${stepId - 1} first`);
      return;
    }
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

  const handleSave = () => {
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
