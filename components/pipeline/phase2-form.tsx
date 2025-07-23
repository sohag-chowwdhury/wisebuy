"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  ExternalLink,
  Save,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
} from "lucide-react";

// Phase completion status
type PhaseStatus = "pending" | "running" | "completed" | "failed";

interface PhaseState {
  status: PhaseStatus;
  isRunning: boolean;
}

export interface MarketResearchData {
  marketResearch: {
    amazonPrice: number;
    amazonLink: string;
    ebayPrice: number;
    ebayLink: string;
    msrp: number;
    competitivePrice: number;
  };
  specifications: {
    brand: string;
    category: string;
    year: string;
    weight: string;
    dimensions: string;
    technical_specs?: Record<string, any>;
  };
}

interface Phase2FormProps {
  data: MarketResearchData;
  onUpdate: (data: MarketResearchData) => void;
  onSave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  phaseState: PhaseState;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  canStart: boolean;
}

export function Phase2Form({
  data,
  onUpdate,
  onSave,
  onNext,
  onPrevious,
  phaseState,
  onStart,
  onStop,
  onRestart,
  canStart,
}: Phase2FormProps) {
  const [localData, setLocalData] = useState(data);

  const handleMarketResearchChange = (
    field: keyof MarketResearchData["marketResearch"],
    value: string | number
  ) => {
    const newData = {
      ...localData,
      marketResearch: {
        ...localData.marketResearch,
        [field]: value,
      },
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleSpecificationsChange = (
    field: keyof MarketResearchData["specifications"],
    value: string
  ) => {
    const newData = {
      ...localData,
      specifications: {
        ...localData.specifications,
        [field]: value,
      },
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const renderPhaseControls = () => {
    if (phaseState.status === "pending") {
      return (
        <Button
          onClick={onStart}
          disabled={!canStart}
          size="sm"
          className="mr-2"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Research
        </Button>
      );
    }

    if (phaseState.status === "running") {
      return (
        <div className="flex gap-2">
          <Button onClick={onStop} variant="destructive" size="sm">
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
          <Button onClick={onRestart} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        </div>
      );
    }

    if (phaseState.status === "completed") {
      return (
        <Button onClick={onRestart} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Restart
        </Button>
      );
    }

    return null;
  };

  const getStatusColor = () => {
    switch (phaseState.status) {
      case "completed":
        return "text-green-600";
      case "running":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Market Research & Specifications
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pricing analysis and product specifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                phaseState.status === "completed"
                  ? "default"
                  : phaseState.status === "running"
                  ? "secondary"
                  : "outline"
              }
            >
              <span className={getStatusColor()}>{phaseState.status}</span>
            </Badge>
            {renderPhaseControls()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* API Cost Notification */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                📋 Note: Real API Integration Required
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                For real Amazon & eBay links: <strong>SERP API</strong> needed (5000 searches for $50 USD) • <strong>eBay API</strong> is free. 
                Currently showing demo links until APIs are configured.
              </p>
            </div>
          </div>
        </div>

        {/* Market Research Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Market Research</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amazonPrice">Amazon Price ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="amazonPrice"
                  type="number"
                  step="0.01"
                  value={localData.marketResearch.amazonPrice}
                  onChange={(e) =>
                    handleMarketResearchChange(
                      "amazonPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(localData.marketResearch.amazonLink, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amazonLink">Amazon Link</Label>
              <Input
                id="amazonLink"
                value={localData.marketResearch.amazonLink}
                onChange={(e) =>
                  handleMarketResearchChange("amazonLink", e.target.value)
                }
                placeholder="https://amazon.com/dp/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebayPrice">eBay Price ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="ebayPrice"
                  type="number"
                  step="0.01"
                  value={localData.marketResearch.ebayPrice}
                  onChange={(e) =>
                    handleMarketResearchChange(
                      "ebayPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(localData.marketResearch.ebayLink, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebayLink">eBay Link</Label>
              <Input
                id="ebayLink"
                value={localData.marketResearch.ebayLink}
                onChange={(e) =>
                  handleMarketResearchChange("ebayLink", e.target.value)
                }
                placeholder="https://ebay.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msrp">MSRP ($)</Label>
              <Input
                id="msrp"
                type="number"
                step="0.01"
                value={localData.marketResearch.msrp}
                onChange={(e) =>
                  handleMarketResearchChange(
                    "msrp",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitivePrice">Competitive Price ($)</Label>
              <Input
                id="competitivePrice"
                type="number"
                step="0.01"
                value={localData.marketResearch.competitivePrice}
                onChange={(e) =>
                  handleMarketResearchChange(
                    "competitivePrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Specifications Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Specifications</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={localData.specifications.brand}
                onChange={(e) =>
                  handleSpecificationsChange("brand", e.target.value)
                }
                placeholder="Enter brand name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={localData.specifications.category}
                onChange={(e) =>
                  handleSpecificationsChange("category", e.target.value)
                }
                placeholder="Enter category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={localData.specifications.year}
                onChange={(e) =>
                  handleSpecificationsChange("year", e.target.value)
                }
                placeholder="e.g., 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={localData.specifications.weight}
                onChange={(e) =>
                  handleSpecificationsChange("weight", e.target.value)
                }
                placeholder="e.g., 2.5 lbs"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={localData.specifications.dimensions}
                onChange={(e) =>
                  handleSpecificationsChange("dimensions", e.target.value)
                }
                placeholder="e.g., 12 x 8 x 10 inches"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline" onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>
          </div>
          <Button onClick={onNext}>
            Continue to SEO Analysis
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {/* Data Summary Section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Merged Data Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Product Info</p>
              <p>Brand: {localData.specifications.brand}</p>
              <p>Category: {localData.specifications.category}</p>
              <p>Year: {localData.specifications.year}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Market Pricing</p>
              <p>Amazon: ${localData.marketResearch.amazonPrice.toFixed(2)}</p>
              <p>eBay: ${localData.marketResearch.ebayPrice.toFixed(2)}</p>
              <p>MSRP: ${localData.marketResearch.msrp.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Physical Specs</p>
              <p>Weight: {(localData.specifications.weight === 'Unknown' || localData.specifications.weight === 'Not found') ? 'Not found - tune AI prompt' : localData.specifications.weight}</p>
              <p>Dimensions: {
                localData.specifications.dimensions === 'Unknown' || 
                localData.specifications.dimensions === 'Not found' ||
                localData.specifications.dimensions.includes('"Unknown"') ||
                localData.specifications.dimensions.includes('"Not found"')
                  ? 'Not found - tune AI prompt' 
                  : localData.specifications.dimensions
              }</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Technical Specs</p>
              {localData.specifications.technical_specs && Object.keys(localData.specifications.technical_specs).length > 0 ? (
                Object.entries(localData.specifications.technical_specs).slice(0, 3).map(([key, value]) => (
                  <p key={key} className="truncate text-xs">{key}: {String(value)}</p>
                ))
              ) : (
                <p className="text-amber-600 text-xs">Not found - tune AI prompt</p>
              )}
              {localData.specifications.technical_specs && Object.keys(localData.specifications.technical_specs).length > 3 && (
                <p className="text-xs text-muted-foreground">+{Object.keys(localData.specifications.technical_specs).length - 3} more...</p>
              )}
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3 w-3" />
              Data combined from products, market_research_data, and seo_analysis_data tables
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
