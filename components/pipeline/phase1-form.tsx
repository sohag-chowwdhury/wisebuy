"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Save, ChevronRight, Play, Square, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

// Phase completion status
type PhaseStatus = "pending" | "running" | "completed" | "failed";

interface PhaseState {
  status: PhaseStatus;
  isRunning: boolean;
}

interface ProductImage {
  id: string;
  imageUrl: string;
  fileName?: string;
  fileSize?: number;
  isPrimary: boolean;
}

export interface ProductAnalysisData {
  productName: string;
  model: string;
  confidence: number;
  itemCondition: string;
  conditionDetails: string;
  images?: ProductImage[];
}

interface Phase1FormProps {
  data: ProductAnalysisData;
  onUpdate: (data: ProductAnalysisData) => void;
  onSave: () => void;
  onNext: () => void;
  phaseState: PhaseState;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  canStart: boolean;
}

export function Phase1Form({
  data,
  onUpdate,
  onSave,
  onNext,
  phaseState,
  onStart,
  onStop,
  onRestart,
  canStart,
}: Phase1FormProps) {
  // Ensure all fields have default values to prevent uncontrolled to controlled input errors
  const normalizeData = (inputData: ProductAnalysisData): ProductAnalysisData => ({
    productName: inputData.productName ?? '',
    model: inputData.model ?? '',
    confidence: inputData.confidence ?? 0,
    itemCondition: inputData.itemCondition ?? '',
    conditionDetails: inputData.conditionDetails ?? '',
    images: inputData.images ?? [],
  });

  const [localData, setLocalData] = useState(() => normalizeData(data));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const params = useParams();
  const productId = params.id as string;

  // Update local data when props change
  useEffect(() => {
    const normalizedData = normalizeData(data);
    setLocalData(normalizedData);
  }, [data]);

  const handleChange = (field: keyof ProductAnalysisData, value: string | number) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleSave = async () => {
    if (!productId || isSaving) return;

    setIsSaving(true);
    try {
      console.log('🔧 [PHASE1-FORM] Saving Phase 1 data:', localData);

      const response = await fetch(`/api/products/${productId}/phase1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Save failed with status ${response.status}`);
      }

      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        toast.success('✅ Phase 1 data saved successfully!');
        onSave(); // Call the original onSave callback
        console.log('✅ [PHASE1-FORM] Save successful:', result);
      } else {
        throw new Error(result.error || 'Save operation failed');
      }

    } catch (error) {
      console.error('❌ [PHASE1-FORM] Save error:', error);
      toast.error(`Failed to save Phase 1 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          Start Analysis
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
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI identification and condition assessment
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
      <CardContent className="space-y-6">
        {/* Product Images */}
        {localData.images && localData.images.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {localData.images.map((image, index) => (
                <div
                  key={image.id || index}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.fileName || `Product image ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = 
                        `<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Image not available</div>`;
                    }}
                  />
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {localData.images.length} images analyzed by AI
            </p>
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            value={localData.productName}
            onChange={(e) => handleChange("productName", e.target.value)}
            placeholder="Enter product name"
          />
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={localData.model}
            onChange={(e) => handleChange("model", e.target.value)}
            placeholder="Enter model details"
          />
        </div>

        {/* AI Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>AI Confidence</Label>
            <Badge variant="secondary">{localData.confidence}%</Badge>
          </div>
          <Progress value={localData.confidence} className="h-2" />
        </div>

        {/* Item Condition */}
        <div className="space-y-2">
          <Label htmlFor="itemCondition">Item Condition</Label>
          <Select
            value={localData.itemCondition}
            onValueChange={(value) => handleChange("itemCondition", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="very-good">Very Good</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="acceptable">Acceptable</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Condition Details */}
        <div className="space-y-2">
          <Label htmlFor="conditionDetails">Condition Details</Label>
          <Textarea
            id="conditionDetails"
            value={localData.conditionDetails}
            onChange={(e) => handleChange("conditionDetails", e.target.value)}
            placeholder="Describe the condition in detail..."
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-3">
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
            Continue to Market Research
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
