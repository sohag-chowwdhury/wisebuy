"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stepper } from "@/components/upload/stepper";
import { ProgressCard } from "@/components/upload/progress-card";
import { ValidationCard } from "@/components/upload/validation-card";
import { Phase1Results } from "@/components/upload/phase1-results";
import { Phase2Results } from "@/components/upload/phase2-results";
import { Phase3Results } from "@/components/upload/phase3-results";
import { Phase4Results } from "@/components/upload/phase4-results";
import { useUploadProcess } from "@/components/upload/use-upload-process";
import { UploadDialogProps } from "@/lib/types";

export function UploadDialog({
  isOpen,
  onClose,
  onSuccess,
  files,
}: UploadDialogProps) {
  const {
    // State
    stage,
    currentPhase,
    progress,
    statusMessage,
    analysisResult,
    msrpData,
    specificationsData,
    competitiveData,
    pricingSuggestion,
    seoData,
    conditionInspection,
    customPrice,
    selectedPlatforms,
    productStatus,

    // Actions
    handlePhase2Start,
    handlePhase3Start,
    handlePhase4Start,
    handleValidation,
    handleConditionInspectionChange,
    handlePriceChange,
    handlePlatformToggle,
    handleStatusChange,
    publishWithFiles,
    handleSaveDraft,
    handleClose: closeProcess,
  } = useUploadProcess({ isOpen, files, onSuccess });

  const handleClose = () => {
    closeProcess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw] max-w-[95vw] sm:w-full overflow-y-auto p-0">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FlipForge Processing Pipeline
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Horizontal Stepper */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Stepper
            currentPhase={currentPhase}
            isProcessing={stage === "analyzing"}
          />
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Upload/Analysis Progress */}
          {(stage === "uploading" || stage === "analyzing") && (
            <ProgressCard
              stage={stage}
              currentPhase={currentPhase}
              progress={progress}
              statusMessage={statusMessage}
              filesCount={files.length}
            />
          )}

          {/* Validation Required */}
          {stage === "validation" && analysisResult && (
            <ValidationCard
              analysisResult={analysisResult}
              onConfirm={handleValidation}
            />
          )}

          {/* Phase Results */}
          {stage === "complete" && (
            <>
              {currentPhase === 1 && analysisResult && (
                <Phase1Results
                  analysisResult={analysisResult}
                  conditionInspection={conditionInspection}
                  onConditionChange={handleConditionInspectionChange}
                  onContinue={handlePhase2Start}
                />
              )}

              {currentPhase === 2 && (
                <Phase2Results
                  marketResearchData={{
                    msrpData,
                    specificationsData,
                    competitiveData,
                  }}
                  onContinue={handlePhase3Start}
                />
              )}

              {currentPhase === 3 && (
                <Phase3Results
                  seoAnalysisData={{
                    pricingSuggestion,
                    competitiveData,
                    conditionInspection,
                  }}
                  customPrice={customPrice}
                  onPriceChange={handlePriceChange}
                  onRecalculate={handlePhase3Start}
                  onContinue={handlePhase4Start}
                />
              )}

              {currentPhase === 4 && seoData && (
                <Phase4Results
                  productListingData={{
                    seoData,
                    specificationsData,
                    msrpData,
                    conditionInspection,
                    customPrice,
                    selectedPlatforms,
                    productStatus,
                    files,
                  }}
                  onPriceChange={handlePriceChange}
                  onPlatformToggle={handlePlatformToggle}
                  onStatusChange={handleStatusChange}
                  onPublish={() => publishWithFiles(files)}
                  onSaveDraft={handleSaveDraft}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
