import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  UploadStage,
  ProcessingPhase,
  ProductAnalysis,
  MSRPData,
  ProductSpecifications,
  CompetitiveData,
  PricingSuggestion,
  SEOData,
  StreamingData,
  ProductCondition,
  ConditionInspection,
  ProductStatus,
  WordPressPublishData,
  PublishResponse,
} from "@/lib/types";
import { API_ENDPOINTS, DEFAULT_VALUES } from "@/lib/constants";

interface UploadState {
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
}

const initialState: UploadState = {
  stage: "uploading",
  currentPhase: 1,
  progress: 0,
  statusMessage: "",
  analysisResult: null,
  msrpData: null,
  specificationsData: null,
  competitiveData: null,
  pricingSuggestion: null,
  seoData: null,
  selectedCondition: DEFAULT_VALUES.CONDITION,
  conditionInspection: {
    itemCondition: "used-good",
    productCondition: "",
  },
  customPrice: "",
  selectedPlatforms: [],
  productStatus: "draft",
};

export function useUploadProcess({
  isOpen,
  files,
  onSuccess,
}: {
  isOpen: boolean;
  files: File[];
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<UploadState>(initialState);

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const processStreamingData = useCallback(
    (data: StreamingData) => {
      switch (data.type) {
        case "progress":
          updateState({ progress: data.value || 0 });
          break;
        case "status":
          updateState({ statusMessage: data.message || "" });
          break;
        case "analysis":
          updateState({ analysisResult: data.result as ProductAnalysis });
          if (
            (data.result as ProductAnalysis)?.confidence >=
            DEFAULT_VALUES.CONFIDENCE_THRESHOLD
          ) {
            updateState({ stage: "complete" });
          } else {
            updateState({ stage: "validation" });
          }
          break;
        case "msrp":
          updateState({ msrpData: data.result as MSRPData });
          break;
        case "specifications":
          updateState({
            specificationsData: data.result as ProductSpecifications,
          });
          break;
        case "competitive":
          updateState({ competitiveData: data.result as CompetitiveData });
          break;
        case "complete":
          updateState({ stage: "complete" });
          break;
        case "error":
          toast.error(data.message || "An error occurred");
          break;
      }
    },
    [updateState]
  );

  const handleUpload = useCallback(
    async (uploadFiles?: File[]) => {
      const filesToUpload = uploadFiles || files;
      updateState({ stage: "uploading", progress: 0, currentPhase: 1 });

      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("images", file);
      });

      try {
        const response = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        updateState({ stage: "analyzing" });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              processStreamingData(data);
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Failed to upload files");
        throw error;
      }
    },
    [files, updateState, processStreamingData]
  );

  // Auto-start upload when dialog opens with files
  useEffect(() => {
    if (isOpen && files.length > 0) {
      handleUpload();
    }
  }, [isOpen, files, handleUpload]);

  const handlePhase2 = useCallback(async () => {
    if (!state.analysisResult?.model) return;

    updateState({
      currentPhase: 2,
      stage: "analyzing",
      progress: 0,
      statusMessage: "Starting data enrichment...",
    });

    try {
      const response = await fetch(API_ENDPOINTS.ENRICH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productModel: state.analysisResult.model }),
      });

      if (!response.ok) throw new Error("Phase 2 failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            processStreamingData(data);
          } catch (e) {
            console.error("Error parsing Phase 2 chunk:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error in Phase 2:", error);
      toast.error("Failed to complete Phase 2");
      updateState({ stage: "complete" });
    }
  }, [state.analysisResult?.model, updateState, processStreamingData]);

  const handlePhase3 = useCallback(async () => {
    if (
      !state.competitiveData ||
      !state.msrpData ||
      !state.analysisResult?.model
    )
      return;

    updateState({
      currentPhase: 3,
      stage: "analyzing",
      progress: 0,
      statusMessage: "Calculating intelligent pricing...",
    });

    try {
      const response = await fetch(API_ENDPOINTS.PRICING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productModel: state.analysisResult.model,
          condition: state.selectedCondition,
          competitiveData: state.competitiveData,
          currentSellingPrice: state.msrpData.currentSellingPrice,
        }),
      });

      if (!response.ok) throw new Error("Phase 3 failed");

      const result = await response.json();

      if (result.success) {
        updateState({
          pricingSuggestion: result.data,
          customPrice: result.data.suggestedPrice.toString(),
          stage: "complete",
          statusMessage: "Pricing calculation completed!",
        });
        toast.success("Phase 3 completed successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error in Phase 3:", error);
      toast.error("Failed to complete Phase 3");
      updateState({ stage: "complete" });
    }
  }, [
    state.competitiveData,
    state.msrpData,
    state.analysisResult?.model,
    state.selectedCondition,
    updateState,
  ]);

  const handlePhase4 = useCallback(async () => {
    if (
      !state.specificationsData ||
      !state.msrpData ||
      !state.analysisResult?.model ||
      !state.customPrice
    ) {
      return;
    }

    updateState({
      currentPhase: 4,
      stage: "analyzing",
      progress: 0,
      statusMessage: "Generating SEO content...",
    });

    try {
      const response = await fetch(API_ENDPOINTS.SEO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productModel: state.analysisResult.model,
          specifications: state.specificationsData,
          msrpData: state.msrpData,
          condition: state.selectedCondition,
          finalPrice: parseFloat(state.customPrice),
        }),
      });

      if (!response.ok) throw new Error("Phase 4 failed");

      const result = await response.json();

      if (result.success) {
        updateState({
          seoData: result.data,
          stage: "complete",
          statusMessage: "SEO content generated successfully!",
        });
        toast.success("Phase 4 completed successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error in Phase 4:", error);
      toast.error("Failed to complete Phase 4");
      updateState({ stage: "complete" });
    }
  }, [
    state.specificationsData,
    state.msrpData,
    state.analysisResult?.model,
    state.customPrice,
    state.selectedCondition,
    updateState,
  ]);

  // Helper functions for state updates
  const handleConditionUpdate = useCallback(
    (condition: ProductCondition) => {
      updateState({ selectedCondition: condition });
    },
    [updateState]
  );

  const handleConditionInspectionUpdate = useCallback(
    (conditionInspection: ConditionInspection) => {
      updateState({ conditionInspection });
    },
    [updateState]
  );

  const handlePlatformUpdate = useCallback(
    (platformId: string) => {
      updateState({
        selectedPlatforms: state.selectedPlatforms.includes(platformId)
          ? state.selectedPlatforms.filter((p) => p !== platformId)
          : [...state.selectedPlatforms, platformId],
      });
    },
    [state.selectedPlatforms, updateState]
  );

  // Helper function to convert files to base64
  const filesToBase64 = useCallback(
    async (files: File[]): Promise<string[]> => {
      const promises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data:image/...;base64, prefix
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      return Promise.all(promises);
    },
    []
  );

  // Publishing functionality
  const handlePublish = useCallback(
    async (files: File[]) => {
      if (state.selectedPlatforms.length === 0) {
        toast.error("Please select at least one platform to publish to");
        return;
      }

      if (!state.seoData || !state.specificationsData || !state.customPrice) {
        toast.error("Missing required data for publishing");
        return;
      }

      try {
        // Handle each selected platform
        for (const platformId of state.selectedPlatforms) {
          if (platformId === "wordpress") {
            // Convert files to base64
            const base64Images = await filesToBase64(files);

            const publishData: WordPressPublishData = {
              title: state.seoData.title,
              description: state.seoData.productDescription,
              price: parseFloat(state.customPrice),
              status: state.productStatus,
              images: base64Images,
              categories: state.specificationsData.category
                ? [state.specificationsData.category]
                : [],
              tags: state.seoData.tags,
              sku: `${state.specificationsData.brand}-${state.specificationsData.model}`
                .replace(/\s+/g, "-")
                .toLowerCase(),
              stockQuantity: 1,
              condition: state.conditionInspection.itemCondition,
              brand: state.specificationsData.brand,
              specifications: state.specificationsData.technicalSpecs,
            };

            const loadingToast = toast.loading(`Publishing to WordPress...`);

            const response = await fetch(API_ENDPOINTS.PUBLISH, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                platform: platformId,
                data: publishData,
              }),
            });

            const result = await response.json();
            toast.dismiss(loadingToast);

            if (result.success && result.data) {
              const publishResult = result.data as PublishResponse;
              toast.success(
                `Successfully published to WordPress! Product ID: ${publishResult.productId}`
              );
              if (publishResult.productUrl) {
                console.log(`Product URL: ${publishResult.productUrl}`);
              }
            } else {
              throw new Error(result.error || "Failed to publish to WordPress");
            }
          } else {
            // For other platforms, show "not implemented" message
            toast.info(`${platformId}: Work in progress - not implemented yet`);
          }
        }

        // Reset state and call success callback after successful publishing
        reset();
        // Small delay to let the success toast show before closing
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } catch (error) {
        console.error("Publishing error:", error);
        // Dismiss any loading toasts
        toast.dismiss();
        toast.error(
          error instanceof Error ? error.message : "Failed to publish product"
        );
      }
    },
    [state, filesToBase64, reset, onSuccess]
  );

  const handleSaveDraft = useCallback(() => {
    // Update status to draft and save
    updateState({ productStatus: "draft" });
    toast.success("Product saved as draft");
    // Don't reset state for draft, keep the form
  }, [updateState]);

  // Export the actual publish function with files support
  const publishWithFiles = useCallback(
    (files: File[]) => {
      return handlePublish(files);
    },
    [handlePublish]
  );

  return {
    // State
    ...state,

    // State management
    updateState,
    reset,

    // Core flow methods with aliases
    handleUpload,
    handlePhase1Start: handleUpload,
    handlePhase2Start: handlePhase2,
    handlePhase3Start: handlePhase3,
    handlePhase4Start: handlePhase4,

    // Legacy methods (keep for compatibility)
    handlePhase2,
    handlePhase3,
    handlePhase4,

    // User interaction handlers
    handleConditionChange: handleConditionUpdate,
    handleConditionInspectionChange: handleConditionInspectionUpdate,
    handlePriceChange: (price: string) => updateState({ customPrice: price }),
    handlePlatformToggle: handlePlatformUpdate,
    handleStatusChange: (status: ProductStatus) =>
      updateState({ productStatus: status }),
    handleValidation: (correctedModel?: string) => {
      if (correctedModel && state.analysisResult) {
        updateState({
          analysisResult: { ...state.analysisResult, model: correctedModel },
          stage: "complete",
        });
      } else {
        updateState({ stage: "complete" });
      }
    },
    publishWithFiles,
    handleSaveDraft,
    handleClose: reset,
  };
}
