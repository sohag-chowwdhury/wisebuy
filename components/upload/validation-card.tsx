"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { ProductAnalysis } from "@/lib/types";

interface ValidationCardProps {
  analysisResult: ProductAnalysis;
  onConfirm: (correctedModel?: string) => void;
}

export function ValidationCard({
  analysisResult,
  onConfirm,
}: ValidationCardProps) {
  const [productModel, setProductModel] = useState("");

  const handleSubmit = () => {
    const finalModel =
      analysisResult.confidence < 80 && productModel
        ? productModel
        : analysisResult.model;
    onConfirm(finalModel);
  };

  const isValid =
    analysisResult.confidence >= 80 || productModel.trim().length > 0;

  return (
    <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Validation Required
            </CardTitle>
            <CardDescription>
              Please review and confirm the detected product information
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Detected Model
            </Label>
            <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-2 rounded border break-words">
              {analysisResult.model}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Confidence Score
            </Label>
            <div className="flex items-center gap-2">
              <Progress
                value={analysisResult.confidence}
                className="flex-1 h-2"
              />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                {analysisResult.confidence}%
              </span>
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Detected Issues
            </Label>
            <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-2 rounded border break-words">
              {analysisResult.defects.length > 0
                ? analysisResult.defects.join(", ")
                : "None detected"}
            </p>
          </div>
        </div>

        {analysisResult.confidence < 80 && (
          <div className="space-y-2 p-3 sm:p-4 bg-amber-100/50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
            <Label htmlFor="model" className="text-sm font-medium">
              Please confirm or correct the product model:
            </Label>
            <Input
              id="model"
              value={productModel}
              onChange={(e) => setProductModel(e.target.value)}
              placeholder={analysisResult.model}
              className="bg-white dark:bg-white/5"
            />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              The AI confidence is below 80%. Please verify the product model is
              correct.
            </p>
          </div>
        )}

        {analysisResult.confidence >= 80 && (
          <div className="p-3 sm:p-4 bg-green-100/50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ High confidence detection. The product model looks correct.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
          >
            Confirm & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
