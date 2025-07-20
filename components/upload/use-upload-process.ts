// components/upload/use-upload-process.ts
"use client"
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
  ProductStatus
} from "@/lib/types";
import { API_ENDPOINTS, DEFAULT_VALUES } from "@/lib/constants";
import { parseStreamingData } from '@/lib/type-utils';

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
  productId?: string; // Add productId to state
  imageUrls?: string[]; // Add imageUrls to state
}

const initialState: UploadState = {
  stage: "uploading",
  currentPhase: 1,
  progress: 0,
  statusMessage: "Preparing upload...",
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
  productId: undefined,
  imageUrls: undefined,
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
      console.log('📥 [UPLOAD] Received streaming data:', data);
      
      switch (data.type) {
        case "progress":
          updateState({ progress: data.value });
          break;
          
        case "status":
          updateState({ statusMessage: data.message });
          break;
          
        case "analysis":
          updateState({ 
            analysisResult: data.result,
            stage: data.result.confidence >= DEFAULT_VALUES.CONFIDENCE_THRESHOLD ? "complete" : "validation"
          });
          break;
          
        case "msrp":
          updateState({ msrpData: data.result });
          break;
          
        case "specifications":
          updateState({ specificationsData: data.result });
          break;
          
        case "competitive":
          updateState({ competitiveData: data.result });
          break;
          
        case "pricing":
          updateState({ pricingSuggestion: data.result });
          break;
          
        case "seo":
          updateState({ seoData: data.result });
          break;
          
        case "complete":
          // Handle completion with proper typing
          updateState({ 
            productId: data.result.productId,
            stage: "complete",
            statusMessage: data.result.message,
            progress: 100,
            imageUrls: data.result.imageUrls
          });
          
          if (data.result.success) {
            toast.success("Upload completed successfully! Background processing will continue.");
            
            // Auto-close after 2 seconds if successful
            setTimeout(() => {
              if (onSuccess) {
                onSuccess();
              }
            }, 2000);
          }
          break;
          
        case "error":
          console.error('❌ [UPLOAD] Streaming error:', data.message);
          updateState({ 
            stage: "uploading", // Reset to allow retry
            statusMessage: data.message
          });
          toast.error(data.message);
          break;
      }
    },
    [updateState, onSuccess]
  );

  const handleUpload = useCallback(
    async (uploadFiles?: File[]) => {
      const filesToUpload = uploadFiles || files;
      
      if (!filesToUpload || filesToUpload.length === 0) {
        toast.error("No files selected for upload");
        return;
      }

      console.log(`📤 [UPLOAD] Starting upload with ${filesToUpload.length} files`);
      
      updateState({ 
        stage: "uploading", 
        progress: 0, 
        currentPhase: 1,
        statusMessage: "Preparing upload...",
        productId: undefined,
        imageUrls: undefined
      });

      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("images", file);
      });

      try {
        updateState({ statusMessage: "Connecting to server..." });
        
        console.log('🌐 [UPLOAD] Making request to:', API_ENDPOINTS.UPLOAD);
        console.log('🌐 [UPLOAD] FormData files:', filesToUpload.map(f => f.name));
        
        const response = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          body: formData,
        });

        console.log('🌐 [UPLOAD] Response status:', response.status);
        console.log('🌐 [UPLOAD] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = "Upload failed";
          try {
            const errorData = await response.json();
            console.log('🌐 [UPLOAD] Error response data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Removed unused variable 'e'
            errorMessage = `Upload failed with status ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response stream available");
        }

        updateState({ 
          stage: "analyzing",
          statusMessage: "Processing upload..." 
        });

        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              const data = parseStreamingData(line);
              if (data) {
                processStreamingData(data);
              }
            }
          }
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
          const data = parseStreamingData(buffer);
          if (data) {
            processStreamingData(data);
          }
        }

      } catch (error) {
        console.error("💥 [UPLOAD] Upload error:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        
        updateState({ 
          stage: "uploading", // Reset to allow retry
          statusMessage: `Error: ${errorMessage}`,
          progress: 0
        });
        
        toast.error(errorMessage);
        throw error;
      }
    },
    [files, updateState, processStreamingData]
  );

  // Auto-start upload when dialog opens with files
  useEffect(() => {
    if (isOpen && files.length > 0 && state.stage === "uploading" && state.progress === 0) {
      console.log('🚀 [UPLOAD] Auto-starting upload...');
      handleUpload();
    }
  }, [isOpen, files, handleUpload, state.stage, state.progress]);

  // Rest of your existing methods (Phase 2, 3, 4, etc.) remain the same
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
          } catch (error) {
            console.error("Error parsing Phase 2 chunk:", error);
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
    if (!state.competitiveData || !state.msrpData || !state.analysisResult?.model) return;

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
      }
    } catch (error) {
      console.error("Error in Phase 3:", error);
      toast.error("Failed to complete Phase 3");
      updateState({ stage: "complete" });
    }
  }, [state.competitiveData, state.msrpData, state.analysisResult?.model, state.selectedCondition, updateState]);

  // Add other handler methods...
  const handleConditionUpdate = useCallback((condition: ProductCondition) => {
    updateState({ selectedCondition: condition });
  }, [updateState]);

  const handleConditionInspectionUpdate = useCallback((inspection: ConditionInspection) => {
    updateState({ conditionInspection: inspection });
  }, [updateState]);

  const handlePlatformUpdate = useCallback((platform: string) => {
    setState((prev: UploadState) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  }, []);

  // Add placeholder methods for phases 4 and publishing
  const handlePhase4 = useCallback(async () => {
    // Implementation for phase 4
    console.log("Phase 4 not implemented yet");
  }, []);

  const handlePublish = useCallback(async (files?: File[]) => {
    // Implementation for publishing
    console.log("Publishing not implemented yet", { filesCount: files?.length });
  }, []);

  const handleSaveDraft = useCallback(() => {
    updateState({ productStatus: "draft" });
    toast.success("Product saved as draft");
  }, [updateState]);

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

    // Core flow methods
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
    handleStatusChange: (status: ProductStatus) => updateState({ productStatus: status }),
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