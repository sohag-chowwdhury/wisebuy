"use client";

import { useState, useEffect } from "react";
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
  CheckCircle,
} from "lucide-react";
import { WooCommerceCategorySelect } from "@/components/ui/woocommerce-category-select";
import { toast } from "sonner";
import { useParams } from "next/navigation";

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
    // Replace single weight and dimensions with individual fields
    height: string;
    width: string;
    length: string;
    weight: string;
    technical_specs?: Record<string, any>;
    // Keep legacy fields for backward compatibility
    dimensions?: string;
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
  // Ensure all fields have default values to prevent uncontrolled to controlled input errors
  const normalizeData = (inputData: MarketResearchData): MarketResearchData => ({
    marketResearch: {
      amazonPrice: inputData.marketResearch?.amazonPrice ?? 0,
      amazonLink: inputData.marketResearch?.amazonLink ?? '',
      ebayPrice: inputData.marketResearch?.ebayPrice ?? 0,
      ebayLink: inputData.marketResearch?.ebayLink ?? '',
      msrp: inputData.marketResearch?.msrp ?? 0,
      competitivePrice: inputData.marketResearch?.competitivePrice ?? 0,
    },
    specifications: {
      brand: inputData.specifications?.brand ?? '',
      category: inputData.specifications?.category ?? '',
      year: inputData.specifications?.year ?? '',
      height: inputData.specifications?.height ?? '',
      width: inputData.specifications?.width ?? '',
      length: inputData.specifications?.length ?? '',
      weight: inputData.specifications?.weight ?? '',
      technical_specs: inputData.specifications?.technical_specs ?? {},
      dimensions: inputData.specifications?.dimensions ?? '',
    }
  });

  const [localData, setLocalData] = useState(() => normalizeData(data));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const params = useParams();
  const productId = params.id as string;

  // Parse dimensions JSON string to extract individual values
  const parseDimensionsFromJSON = (dimensionsString: string) => {
    try {
      if (!dimensionsString || dimensionsString === 'Unknown' || dimensionsString === 'Not found') {
        return { height: '', width: '', length: '', weight: '' };
      }

      // Try to parse as JSON
      const parsed = JSON.parse(dimensionsString);
      
      // Extract numeric values from strings like "11.20 inches" or "89.60 oz"
      const extractNumber = (value: string | number) => {
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
          const match = value.match(/[\d.]+/);
          return match ? match[0] : '';
        }
        return '';
      };

      const result = {
        height: extractNumber(parsed.height || ''),
        width: extractNumber(parsed.width || ''),
        length: extractNumber(parsed.length || ''),
        weight: extractNumber(parsed.weight || ''),
      };

      console.log('🔍 [DIMENSION-PARSER] Parsed dimensions:', {
        original: dimensionsString,
        parsed: parsed,
        result: result
      });

      return result;
    } catch (error) {
      console.log('❌ [DIMENSION-PARSER] Could not parse dimensions JSON:', error, dimensionsString);
      return { height: '', width: '', length: '', weight: '' };
    }
  };

  // Update local data when props change and handle dimension parsing
  useEffect(() => {
    const normalizedData = normalizeData(data);
    
    console.log('🔧 [PHASE2-FORM] Processing dimensions data:', {
      hasDimensions: !!data.specifications?.dimensions,
      dimensions: data.specifications?.dimensions,
      currentValues: {
        height: normalizedData.specifications.height,
        width: normalizedData.specifications.width,
        length: normalizedData.specifications.length,
        weight: normalizedData.specifications.weight
      }
    });

    if (data.specifications?.dimensions) {
      const parsedDimensions = parseDimensionsFromJSON(data.specifications.dimensions);
      
      // Check if we need to update any fields (including replacing "Unknown" values)
      const shouldUpdate = 
        (!normalizedData.specifications.height || normalizedData.specifications.height === '') ||
        (!normalizedData.specifications.width || normalizedData.specifications.width === '') ||
        (!normalizedData.specifications.length || normalizedData.specifications.length === '') ||
        (!normalizedData.specifications.weight || normalizedData.specifications.weight === 'Unknown' || normalizedData.specifications.weight === 'Not found');
      
      console.log('🔧 [PHASE2-FORM] Should update?', shouldUpdate, {
        parsedDimensions,
        hasAnyParsedValues: !!(parsedDimensions.height || parsedDimensions.width || parsedDimensions.length || parsedDimensions.weight)
      });

      if (shouldUpdate && (parsedDimensions.height || parsedDimensions.width || parsedDimensions.length || parsedDimensions.weight)) {
        const updatedData = {
          ...normalizedData,
          specifications: {
            ...normalizedData.specifications,
            height: parsedDimensions.height || normalizedData.specifications.height,
            width: parsedDimensions.width || normalizedData.specifications.width,
            length: parsedDimensions.length || normalizedData.specifications.length,
            weight: parsedDimensions.weight || (normalizedData.specifications.weight !== 'Unknown' && normalizedData.specifications.weight !== 'Not found' ? normalizedData.specifications.weight : ''),
          }
        };
        
        console.log('✅ [PHASE2-FORM] Updating data with parsed dimensions:', updatedData.specifications);
        setLocalData(updatedData);
        return;
      }
    }
    
    // Use normalized data
    setLocalData(normalizedData);
  }, [data]);

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

  const handleSave = async () => {
    if (!productId || isSaving) return;

    setIsSaving(true);
    try {
      // Convert individual dimension fields back to the format the API expects
      const apiData = {
        ...localData,
        specifications: {
          ...localData.specifications,
          // Keep individual fields for form use, but also provide combined dimensions field for API compatibility
          dimensions: JSON.stringify({
            height: localData.specifications.height ? `${localData.specifications.height} inches` : '',
            width: localData.specifications.width ? `${localData.specifications.width} inches` : '',
            length: localData.specifications.length ? `${localData.specifications.length} inches` : '',
            weight: localData.specifications.weight ? `${localData.specifications.weight}` : ''
          }),
          // Ensure weight is also saved in the separate weight field
          weight: localData.specifications.weight || 'Unknown'
        }
      };

      console.log('🔧 [PHASE2-FORM] Saving Phase 2 data:', {
        original: localData,
        converted: apiData
      });

      const response = await fetch(`/api/products/${productId}/phase2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Save failed with status ${response.status}`);
      }

      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        toast.success('✅ Phase 2 data saved successfully!');
        onSave(); // Call the original onSave callback
        console.log('✅ [PHASE2-FORM] Save successful:', result);
      } else {
        throw new Error(result.error || 'Save operation failed');
      }

    } catch (error) {
      console.error('❌ [PHASE2-FORM] Save error:', error);
      toast.error(`Failed to save Phase 2 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
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
                  disabled
                  className="cursor-not-allowed"
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
                disabled
                className="cursor-not-allowed"
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
                  disabled
                  className="cursor-not-allowed"
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
                disabled
                className="cursor-not-allowed"
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
                disabled
                className="cursor-not-allowed"
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
                disabled
                className="cursor-not-allowed"
              />
            </div>
          </div>
        </div>

                 {/* Specifications Section */}
         <div className="space-y-4">
           <h3 className="text-lg font-semibold">Product Specifications</h3>
           
           {/* Basic Info - 2 columns */}
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
               <WooCommerceCategorySelect
                 id="category"
                 label="Category"
                 value={localData.specifications.category}
                 onChange={(value) =>
                   handleSpecificationsChange("category", value)
                 }
                 placeholder="Select or enter category"
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
               <Label htmlFor="weight">Weight (lbs/oz)</Label>
               <Input
                 id="weight"
                 value={localData.specifications.weight}
                 onChange={(e) =>
                   handleSpecificationsChange("weight", e.target.value)
                 }
                 placeholder="e.g., 2.5 or 89.6"
               />
             </div>
           </div>

           {/* Dimensions - 3 columns in one row */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">Dimensions</Label>
             <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="height" className="text-sm text-muted-foreground">Height (inches)</Label>
                 <Input
                   id="height"
                   type="number"
                   step="0.01"
                   value={localData.specifications.height}
                   onChange={(e) =>
                     handleSpecificationsChange("height", e.target.value)
                   }
                   placeholder="e.g., 9.80"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="width" className="text-sm text-muted-foreground">Width (inches)</Label>
                 <Input
                   id="width"
                   type="number"
                   step="0.01"
                   value={localData.specifications.width}
                   onChange={(e) =>
                     handleSpecificationsChange("width", e.target.value)
                   }
                   placeholder="e.g., 11.20"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="length" className="text-sm text-muted-foreground">Length (inches)</Label>
                 <Input
                   id="length"
                   type="number"
                   step="0.01"
                   value={localData.specifications.length}
                   onChange={(e) =>
                     handleSpecificationsChange("length", e.target.value)
                   }
                   placeholder="e.g., 44.50"
                 />
               </div>
             </div>
           </div>

         </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Progress'}
            </Button>
            {lastSaved && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Saved at {lastSaved}</span>
              </div>
            )}
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
              <p>Weight: {(localData.specifications.weight === 'Unknown' || localData.specifications.weight === 'Not found' || !localData.specifications.weight) ? 'Not found - tune AI prompt' : localData.specifications.weight}</p>
              <p>Height: {localData.specifications.height || 'Not set'}</p>
              <p>Width: {localData.specifications.width || 'Not set'}</p>
              <p>Length: {localData.specifications.length || 'Not set'}</p>
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
