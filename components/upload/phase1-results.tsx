"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ClipboardCheck } from "lucide-react";
import {
  ProductAnalysis,
  ConditionInspection,
  ITEM_CONDITIONS,
  ItemCondition,
} from "@/lib/types";

interface Phase1ResultsProps {
  analysisResult: ProductAnalysis;
  conditionInspection: ConditionInspection;
  onConditionChange: (condition: ConditionInspection) => void;
  onContinue: () => void;
}

export function Phase1Results({
  analysisResult,
  conditionInspection,
  onConditionChange,
  onContinue,
}: Phase1ResultsProps) {
  // Safety checks for analysisResult properties
  if (!analysisResult) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Analysis result not available</p>
      </div>
    );
  }

  // Ensure defects is always an array
  const defects = analysisResult.defects || [];
  const model = analysisResult.model || "Unknown Product";
  const confidence = analysisResult.confidence || 0;

  const handleItemConditionChange = (value: string) => {
    onConditionChange({
      ...conditionInspection,
      itemCondition: value as ItemCondition,
    });
  };

  const handleProductConditionChange = (value: string) => {
    onConditionChange({
      ...conditionInspection,
      productCondition: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">
                Phase 1 Complete!
              </CardTitle>
              <CardDescription>
                Product recognition completed successfully
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                Product
              </Label>
              <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-2 rounded border">
                {model}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                Confidence
              </Label>
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-2 rounded border">
                <Progress
                  value={confidence}
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {confidence}%
                </span>
              </div>
            </div>
          </div>

          {defects.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                Detected Issues
              </Label>
              <div className="bg-white dark:bg-white/5 p-3 rounded border">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {defects.map((defect, index) => (
                    <li key={index}>• {defect}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Condition Input */}
      <Card className="border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-500/20">
              <ClipboardCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Manual Inspection Required
              </CardTitle>
              <CardDescription>
                Human inspectors will determine the actual condition
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="item-condition"
                className="text-sm font-medium text-orange-800 dark:text-orange-200"
              >
                Item Condition (appears on website)
              </Label>
              <Select
                value={conditionInspection?.itemCondition || ""}
                onValueChange={handleItemConditionChange}
              >
                <SelectTrigger id="item-condition">
                  <SelectValue placeholder="Select item condition" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="product-condition"
                className="text-sm font-medium text-orange-800 dark:text-orange-200"
              >
                Product Condition Details
              </Label>
              <Input
                id="product-condition"
                placeholder="e.g., missing button, scratched on left side"
                value={conditionInspection?.productCondition || ""}
                onChange={(e) => handleProductConditionChange(e.target.value)}
                className="bg-white dark:bg-white/5"
              />
            </div>
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 p-2 rounded">
            <strong>Note:</strong> Please inspect the item thoroughly and enter
            specific details about any defects, missing parts, or cosmetic
            issues.
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={onContinue}
              disabled={!conditionInspection?.itemCondition}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              Continue to Phase 2
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}