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
    msrp: number;
    competitivePrice: number;
  };
  specifications: {
    brand: string;
    category: string;
    year: string;
    weight: string;
    dimensions: string;
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
        {/* Market Research Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Market Research</h3>
          <div className="grid grid-cols-2 gap-4">
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
      </CardContent>
    </Card>
  );
}
