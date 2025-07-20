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
import {
  CheckCircle,
  Calculator,
  DollarSign,
  TrendingUp,
  Globe,
  Info,
} from "lucide-react";
import {
  PricingSuggestion,
  CompetitiveData,
  ConditionInspection,
  ITEM_CONDITIONS,
} from "@/lib/types";

interface Phase3ResultsProps {
  seoAnalysisData: {
    pricingSuggestion: PricingSuggestion | null;
    competitiveData: CompetitiveData | null;
    conditionInspection: ConditionInspection;
  };
  customPrice: string;
  onPriceChange: (price: string) => void;
  onRecalculate: () => void;
  onContinue: () => void;
}

export function Phase3Results({
  seoAnalysisData,
  customPrice,
  onPriceChange,
  onContinue,
}: Phase3ResultsProps) {
  const { pricingSuggestion, conditionInspection } = seoAnalysisData;
  const itemConditionLabel =
    ITEM_CONDITIONS.find((c) => c.value === conditionInspection.itemCondition)
      ?.label || conditionInspection.itemCondition;

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
                Phase 3 Complete!
              </CardTitle>
              <CardDescription>
                Intelligent pricing calculation completed successfully
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Competitive Prices Summary */}
      {pricingSuggestion && (
        <Card className="border-gray-200 dark:border-gray-500/20 bg-gray-50/50 dark:bg-gray-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-500/20">
                <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Competitive Prices Found
                </CardTitle>
                <CardDescription>
                  Current marketplace pricing data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingSuggestion.competitivePrices.map((price, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-white/5 p-4 rounded-lg border"
                >
                  <Label className="text-sm font-medium">
                    {price.platform}
                  </Label>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    ${price.averagePrice}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Range: ${price.priceRange.low} - ${price.priceRange.high}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condition Information Display */}
      <Card className="border-yellow-200 dark:border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-500/20">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-yellow-900 dark:text-yellow-100">
                Product Condition Information
              </CardTitle>
              <CardDescription>
                Condition determined during inspection in Phase 1
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Item Condition (for website)
              </Label>
              <div className="bg-white dark:bg-white/5 p-3 rounded border font-medium">
                {itemConditionLabel}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Specific Condition Details
              </Label>
              <div className="bg-white dark:bg-white/5 p-3 rounded border">
                {conditionInspection.productCondition ||
                  "No specific details provided"}
              </div>
            </div>
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10 p-2 rounded mt-3">
            <strong>Note:</strong> This condition information was set during the
            manual inspection in Phase 1. Pricing calculations are based on this
            condition assessment.
          </div>
        </CardContent>
      </Card>

      {/* Pricing Suggestion */}
      {pricingSuggestion && (
        <Card className="border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-500/20">
                <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  AI Pricing Suggestion
                </CardTitle>
                <CardDescription>
                  Intelligent pricing based on market analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Suggested Price
                </Label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${pricingSuggestion.suggestedPrice}
                </p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Price Range
                </Label>
                <p className="text-lg text-green-600 dark:text-green-400">
                  ${pricingSuggestion.priceRange.min} - $
                  {pricingSuggestion.priceRange.max}
                </p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Strategy
                </Label>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {pricingSuggestion.pricingStrategy}
                </p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                  Confidence
                </Label>
                <p className="text-lg text-green-600 dark:text-green-400">
                  {pricingSuggestion.confidence}%
                </p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
              <Label className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 block">
                Pricing Reasoning:
              </Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                {pricingSuggestion.reasoning.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Price Input */}
      <Card className="border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/20">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Set Your Price
              </CardTitle>
              <CardDescription>
                Competitive price for your product
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customPrice" className="text-sm font-medium">
                Competitive Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customPrice"
                  type="number"
                  value={customPrice}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your price"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price Reference</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {pricingSuggestion && (
                  <>
                    <p>
                      Suggested:{" "}
                      <span className="font-medium">
                        ${pricingSuggestion.suggestedPrice}
                      </span>
                    </p>
                    <p>
                      Range:{" "}
                      <span className="font-medium">
                        ${pricingSuggestion.priceRange.min} - $
                        {pricingSuggestion.priceRange.max}
                      </span>
                    </p>
                    {pricingSuggestion.profitMargin > 0 && (
                      <p>
                        Profit Margin:{" "}
                        <span className="font-medium text-green-600">
                          {pricingSuggestion.profitMargin}%
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {customPrice && (
            <div className="flex justify-end mt-6">
              <Button
                onClick={onContinue}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Globe className="mr-2 h-4 w-4" />
                Continue to Phase 4
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
