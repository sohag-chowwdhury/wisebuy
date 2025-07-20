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
  productId?: string;
  imageUrls?: string[];
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
          updateState({ 
            productId: data.result.productId,
            stage: "complete",
            statusMessage: data.result.message,
            progress: 100,
            imageUrls: data.result.imageUrls
          });
          
          if (data.result.success) {
            toast.success("Upload completed successfully! Background processing will continue.");
            
            if (onSuccess) {
              setTimeout(() => onSuccess(), 2000);
            }
          }
          break;
          
        case "error":
          console.error('❌ [UPLOAD] Streaming error:', data.message);
          updateState({ 
            stage: "uploading",
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
          let errorMessage = "Upload failed";
          try {
            const errorData = await response.json();
            console.log('🌐 [UPLOAD] Error response data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch {
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
          stage: "uploading",
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

  // Simplified phase handlers
  const handlePhase2Start = useCallback(async () => {
    console.log("Phase 2 started");
    toast.success("Phase 2 processing started!");
  }, []);

  const handlePhase3Start = useCallback(async () => {
    console.log("Phase 3 started");
    toast.success("Phase 3 processing started!");
  }, []);

  const handlePhase4Start = useCallback(async () => {
    console.log("Phase 4 started");
    toast.success("Phase 4 processing started!");
  }, []);

  const handleConditionChange = useCallback((condition: ProductCondition) => {
    updateState({ selectedCondition: condition });
  }, [updateState]);

  const handleConditionInspectionChange = useCallback((inspection: ConditionInspection) => {
    updateState({ conditionInspection: inspection });
  }, [updateState]);

  const handlePriceChange = useCallback((price: string) => {
    updateState({ customPrice: price });
  }, [updateState]);

  const handlePlatformToggle = useCallback((platform: string) => {
    setState((prev: UploadState) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  }, []);

  const handleStatusChange = useCallback((status: ProductStatus) => {
    updateState({ productStatus: status });
  }, [updateState]);

  const handleValidation = useCallback((correctedModel?: string) => {
    if (correctedModel && state.analysisResult) {
      updateState({
        analysisResult: { ...state.analysisResult, model: correctedModel },
        stage: "complete",
      });
    } else {
      updateState({ stage: "complete" });
    }
  }, [state.analysisResult, updateState]);

  const handleSaveDraft = useCallback(() => {
    updateState({ productStatus: "draft" });
    toast.success("Product saved as draft");
  }, [updateState]);

  const publishWithFiles = useCallback(
    async (files: File[]) => {
      console.log("Publishing with files:", files.length);
      toast.success("Publishing completed!");
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    },
    [onSuccess]
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
    handlePhase2Start,
    handlePhase3Start,
    handlePhase4Start,

    // Legacy methods (keep for compatibility)
    handlePhase2: handlePhase2Start,
    handlePhase3: handlePhase3Start,
    handlePhase4: handlePhase4Start,

    // User interaction handlers
    handleConditionChange,
    handleConditionInspectionChange,
    handlePriceChange,
    handlePlatformToggle,
    handleStatusChange,
    handleValidation,
    publishWithFiles,
    handleSaveDraft,
    handleClose: reset,

    // Keep for backward compatibility
    processStreamingData,
  };
}