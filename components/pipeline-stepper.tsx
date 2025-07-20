"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";

interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

// Phase completion status
type PhaseStatus = "pending" | "running" | "completed" | "failed";

interface PhaseState {
  status: PhaseStatus;
  isRunning: boolean;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  currentStep: number;
  phaseStates: Record<number, PhaseState>;
  onStepClick: (stepId: number) => void;
}

export function PipelineStepper({
  steps,
  currentStep,
  phaseStates,
  onStepClick,
}: PipelineStepperProps) {
  const getStepIcon = (step: PipelineStep) => {
    const phase = phaseStates[step.id];
    const isActive = currentStep === step.id;

    switch (phase.status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-600" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case "failed":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return (
          <step.icon
            className={`h-4 w-4 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
        );
    }
  };

  const getStepVariant = (step: PipelineStep) => {
    const phase = phaseStates[step.id];
    const isActive = currentStep === step.id;

    if (phase.status === "completed") return "default";
    if (phase.status === "running") return "secondary";
    if (phase.status === "failed") return "destructive";
    if (isActive) return "outline";
    return "ghost";
  };

  const canClickStep = (stepId: number) => {
    if (stepId === 1) return true;
    return phaseStates[stepId - 1].status === "completed";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <Button
                  variant={getStepVariant(step)}
                  size="sm"
                  className="h-10 w-10 rounded-full p-0 mb-2"
                  onClick={() => onStepClick(step.id)}
                  disabled={!canClickStep(step.id)}
                >
                  {getStepIcon(step)}
                </Button>
                <div className="text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {step.subtitle}
                  </div>
                  <Badge
                    variant={
                      phaseStates[step.id].status === "completed"
                        ? "default"
                        : phaseStates[step.id].status === "running"
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-1 text-xs"
                  >
                    {phaseStates[step.id].status}
                  </Badge>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex items-center mx-4 mb-8">
                  <div
                    className={`h-0.5 w-16 ${
                      phaseStates[step.id].status === "completed"
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
