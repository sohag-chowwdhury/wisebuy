"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Database,
  Sparkles,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { MSRPData, ProductSpecifications, CompetitiveData } from "@/lib/types";

interface Phase2ResultsProps {
  marketResearchData: {
    msrpData: MSRPData | null;
    specificationsData: ProductSpecifications | null;
    competitiveData: CompetitiveData | null;
  } | null;
  onContinue: () => void;
}

export function Phase2Results({
  marketResearchData,
  onContinue,
}: Phase2ResultsProps) {
  const hasData =
    marketResearchData?.msrpData ||
    marketResearchData?.specificationsData ||
    marketResearchData?.competitiveData;
  const isComplete =
    marketResearchData?.msrpData && marketResearchData?.competitiveData;

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
                Phase 2 Complete!
              </CardTitle>
              <CardDescription>
                Data enrichment and market research completed successfully
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {hasData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MSRP Data */}
            {marketResearchData?.msrpData && (
              <Card className="border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-500/20">
                      <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-900 dark:text-purple-100">
                        Market Research
                      </CardTitle>
                      <CardDescription>
                        Current pricing and market data
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Amazon Price
                      </Label>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ${marketResearchData.msrpData.currentSellingPrice}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        MSRP
                      </Label>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ${marketResearchData.msrpData.originalMSRP}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Price Trend
                      </Label>
                      <p className="text-sm text-muted-foreground capitalize">
                        {marketResearchData.msrpData.priceTrend}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Currency
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {marketResearchData.msrpData.currency}
                      </p>
                    </div>
                  </div>
                  {marketResearchData.msrpData.sources.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Price Sources
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {marketResearchData.msrpData.sources.map(
                          (source: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 rounded-md text-xs"
                            >
                              {source}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Specifications Data */}
            {marketResearchData?.specificationsData && (
              <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20">
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-900 dark:text-amber-100">
                        Specifications
                      </CardTitle>
                      <CardDescription>
                        Technical details and features
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Brand
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {marketResearchData.specificationsData.brand}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Category
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {marketResearchData.specificationsData.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Year
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {marketResearchData.specificationsData.yearReleased}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Weight
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {
                          marketResearchData.specificationsData.dimensions
                            .weight
                        }
                      </p>
                    </div>
                  </div>
                  {marketResearchData.specificationsData.keyFeatures.length >
                    0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Key Features
                      </Label>
                      <div className="space-y-1">
                        {marketResearchData.specificationsData.keyFeatures
                          .slice(0, 3)
                          .map((feature, index) => (
                            <p
                              key={index}
                              className="text-xs text-muted-foreground"
                            >
                              • {feature}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Competitive Analysis */}
          {marketResearchData?.competitiveData && (
            <Card className="border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/20">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                      Competitive Analysis
                    </CardTitle>
                    <CardDescription>
                      Marketplace pricing and demand analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* eBay */}
                  <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <Label className="text-sm font-medium">eBay</Label>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      $
                      {
                        marketResearchData.competitiveData.platforms.ebay
                          .averagePrice
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Range: $
                      {
                        marketResearchData.competitiveData.platforms.ebay
                          .priceRange.low
                      }{" "}
                      - $
                      {
                        marketResearchData.competitiveData.platforms.ebay
                          .priceRange.high
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active:{" "}
                      {
                        marketResearchData.competitiveData.platforms.ebay
                          .activeListings
                      }{" "}
                      | Sold:{" "}
                      {
                        marketResearchData.competitiveData.platforms.ebay
                          .soldListings
                      }
                    </p>
                  </div>

                  {/* Facebook */}
                  <div className="bg-white dark:bg-white/5 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <Label className="text-sm font-medium">Facebook</Label>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      $
                      {
                        marketResearchData.competitiveData.platforms.facebook
                          .averagePrice
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Range: $
                      {
                        marketResearchData.competitiveData.platforms.facebook
                          .priceRange.low
                      }{" "}
                      - $
                      {
                        marketResearchData.competitiveData.platforms.facebook
                          .priceRange.high
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Market Demand
                    </Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {marketResearchData.competitiveData.marketDemand}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Best Platforms
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {marketResearchData.competitiveData.bestPlatforms.join(
                        ", "
                      )}
                    </p>
                  </div>
                </div>

                {marketResearchData.competitiveData.insights && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Market Insights
                    </Label>
                    <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-3 rounded border">
                      {marketResearchData.competitiveData.insights}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isComplete && (
            <div className="flex justify-end">
              <Button
                onClick={onContinue}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Continue to Phase 3
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
