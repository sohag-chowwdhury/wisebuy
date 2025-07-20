"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

// Mock product data
const mockProduct = {
  id: "1",
  name: "iPhone 13 Pro Max",
  model: "Apple iPhone 13 Pro Max 128GB Sierra Blue",
  createdAt: "2024-01-15T10:30:00Z",
  platforms: ["WordPress", "Facebook Marketplace", "eBay"],
};

// Initial mock data for all phases
const initialProductAnalysisData: ProductAnalysisData = {
  productName: "iPhone 13 Pro Max",
  model: "Apple iPhone 13 Pro Max 128GB Sierra Blue",
  confidence: 96,
  itemCondition: "good",
  conditionDetails:
    "Minor scratches on the back corner and slight wear on edges. Screen is in perfect condition with no scratches or cracks. All functions work perfectly.",
};

const initialMarketResearchData: MarketResearchData = {
  marketResearch: {
    amazonPrice: 849.99,
    amazonLink: "https://amazon.com/dp/B09G99CW2F",
    msrp: 1099.0,
    competitivePrice: 735.0,
  },
  specifications: {
    brand: "Apple",
    category: "Smartphone",
    year: "2021",
    weight: "8.46 oz (240 g)",
    dimensions: "6.33 × 3.07 × 0.30 in",
  },
};

const initialSEOAnalysisData: SEOAnalysisData = {
  seoTitle: "Apple iPhone 13 Pro Max 128GB Sierra Blue - Unlocked",
  urlSlug: "apple-iphone-13-pro-max-128gb-sierra-blue-unlocked",
  metaDescription:
    "Buy Apple iPhone 13 Pro Max 128GB in Sierra Blue. Unlocked, good condition with A15 Bionic chip, Pro camera system, and all-day battery.",
  keywords: [
    "iPhone 13 Pro Max",
    "Apple iPhone",
    "128GB iPhone",
    "Sierra Blue",
    "unlocked iPhone",
    "smartphone",
  ],
  tags: ["smartphones", "apple", "premium", "unlocked", "camera phone"],
};

const initialProductListingData: ProductListingData = {
  images: ["image1.jpg", "image2.jpg", "image3.jpg"],
  productTitle:
    "Apple iPhone 13 Pro Max 128GB Sierra Blue - Unlocked, Good Condition",
  price: 735.0,
  publishingStatus: "ready-to-publish",
  brand: "Apple",
  category: "Smartphone",
  itemCondition: "good",
  productDescription:
    "Experience the power of iPhone 13 Pro Max with its stunning 6.7-inch ProMotion display and advanced A15 Bionic chip. This device features a Pro camera system with macro photography, Cinematic mode, and exceptional low-light performance. The device is in good condition with minor cosmetic wear but full functionality.",
  keyFeatures: [
    "6.7-inch Super Retina XDR display with ProMotion",
    "A15 Bionic chip with 6-core CPU",
    "Pro camera system with 48MP main camera",
    "Up to 28 hours video playback",
    "5G connectivity",
    "Face ID for secure authentication",
  ],
  channels: {
    wordpress: true,
    facebook: true,
    ebay: true,
    amazon: false,
  },
};

export default function ProcessingPipeline() {
  const router = useRouter();

  // Pipeline state
  const [currentStep, setCurrentStep] = useState(1);
  const [phaseStates, setPhaseStates] = useState<Record<number, PhaseState>>({
    1: { status: "completed", isRunning: false },
    2: { status: "pending", isRunning: false },
    3: { status: "pending", isRunning: false },
    4: { status: "pending", isRunning: false },
  });

  // Phase data states
  const [productAnalysisData, setProductAnalysisData] =
    useState<ProductAnalysisData>(initialProductAnalysisData);
  const [marketResearchData, setMarketResearchData] =
    useState<MarketResearchData>(initialMarketResearchData);
  const [seoAnalysisData, setSEOAnalysisData] = useState<SEOAnalysisData>(
    initialSEOAnalysisData
  );
  const [productListingData, setProductListingData] =
    useState<ProductListingData>(initialProductListingData);

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
            <h1 className="text-2xl font-bold">{mockProduct.name}</h1>
            <p className="text-muted-foreground">{mockProduct.model}</p>
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
                  {mockProduct.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
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

        {/* Current Phase Form */}
        <div className="min-h-[600px]">{renderCurrentPhase()}</div>
      </div>
    </MainLayout>
  );
}
