"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UploadStage, ProcessingPhase } from "@/lib/types";

interface ProgressCardProps {
  stage: UploadStage;
  currentPhase: ProcessingPhase;
  progress: number;
  statusMessage?: string;
  filesCount?: number;
}

export function ProgressCard({
  stage,
  currentPhase,
  progress,
  statusMessage,
  filesCount,
}: ProgressCardProps) {
  const getCardContent = () => {
    if (stage === "uploading") {
      return {
        icon: "📤",
        title: "Uploading Your Images",
        description: `Processing ${filesCount} ${
          filesCount === 1 ? "file" : "files"
        }...`,
        color: "blue",
      };
    }

    if (stage === "analyzing") {
      const phaseData = {
        1: { icon: "🤖", title: "AI Analysis in Progress", color: "primary" },
        2: {
          icon: "📊",
          title: "Data Enrichment in Progress",
          color: "purple",
        },
        3: {
          icon: "💰",
          title: "Intelligent Pricing in Progress",
          color: "orange",
        },
        4: {
          icon: "🔍",
          title: "SEO Optimization in Progress",
          color: "indigo",
        },
      };

      const current = phaseData[currentPhase];
      return {
        icon: current.icon,
        title: current.title,
        description: statusMessage || "Processing your request...",
        color: current.color,
      };
    }

    return {
      icon: "✅",
      title: "Processing Complete",
      description: "Ready for next steps",
      color: "green",
    };
  };

  const { icon, title, description, color } = getCardContent();

  const colorClasses = {
    blue: "border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5",
    primary: "border-primary/20 bg-primary/5",
    purple:
      "border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5",
    orange:
      "border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5",
    indigo:
      "border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5",
    green:
      "border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5",
  };

  return (
    <Card className={cn(colorClasses[color as keyof typeof colorClasses])}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progress}% complete</span>
            <span className="font-medium">
              {stage === "uploading" && filesCount
                ? `${filesCount} files`
                : stage === "analyzing"
                ? "Processing..."
                : "Complete"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
