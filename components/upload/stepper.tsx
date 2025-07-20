"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessingPhase } from "@/lib/types";
import { PROCESSING_PHASES } from "@/lib/constants";

interface StepperProps {
  currentPhase: ProcessingPhase;
  isProcessing: boolean;
}

type StepStatus = "complete" | "current" | "upcoming";

export function Stepper({ currentPhase, isProcessing }: StepperProps) {
  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId < currentPhase) return "complete";
    if (stepId === currentPhase) return "current";
    return "upcoming";
  };

  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
      {PROCESSING_PHASES.map((phase, index) => {
        const status = getStepStatus(phase.id);
        const Icon = phase.icon;

        return (
          <div key={phase.id} className="flex items-center min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                  status === "complete" &&
                    "border-green-500 bg-green-500 text-white",
                  status === "current" &&
                    "border-primary bg-primary text-white",
                  status === "upcoming" &&
                    "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {status === "complete" ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : status === "current" && isProcessing ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <div className="mt-2 text-center max-w-[100px] sm:max-w-[120px]">
                <p
                  className={cn(
                    "text-xs font-medium",
                    status === "current" && "text-primary",
                    status === "complete" && "text-green-600",
                    status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {phase.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {phase.subtitle}
                </p>
              </div>
            </div>
            {index < PROCESSING_PHASES.length - 1 && (
              <div
                className={cn(
                  "mx-2 sm:mx-4 h-0.5 w-8 sm:w-16 transition-all duration-300",
                  phase.id < currentPhase ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
