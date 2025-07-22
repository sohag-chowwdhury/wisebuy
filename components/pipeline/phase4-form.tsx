"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  X,
  Plus,
  Save,
  ChevronLeft,
  Send,
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

export interface ProductListingData {
  images: string[];
  productTitle: string;
  price: number;
  publishingStatus: string;
  brand: string;
  category: string;
  itemCondition: string;
  productDescription: string;
  keyFeatures: string[];
  channels: {
    wordpress: boolean;
    facebook: boolean;
    ebay: boolean;
    amazon: boolean;
  };
}

interface Phase4FormProps {
  data: ProductListingData;
  onUpdate: (data: ProductListingData) => void;
  onSave: () => void;
  onPrevious: () => void;
  onPublish: () => void;
  phaseState: PhaseState;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  canStart: boolean;
}

export function Phase4Form({
  data,
  onUpdate,
  onSave,
  onPrevious,
  onPublish,
  phaseState,
  onStart,
  onStop,
  onRestart,
  canStart,
}: Phase4FormProps) {
  const [localData, setLocalData] = useState(data);
  const [newFeature, setNewFeature] = useState("");

  const handleFieldChange = (
    field: keyof Omit<ProductListingData, "keyFeatures" | "channels">,
    value: string | number
  ) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleChannelChange = (
    channel: keyof ProductListingData["channels"],
    checked: boolean
  ) => {
    const newData = {
      ...localData,
      channels: {
        ...localData.channels,
        [channel]: checked,
      },
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const newData = {
        ...localData,
        keyFeatures: [...localData.keyFeatures, newFeature.trim()],
      };
      setLocalData(newData);
      onUpdate(newData);
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    const newData = {
      ...localData,
      keyFeatures: localData.keyFeatures.filter((f) => f !== feature),
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const getSelectedChannelsCount = () => {
    return Object.values(localData.channels).filter(Boolean).length;
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
          Start Listing
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
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Listing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Multi-platform content publishing and listing creation
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
        {/* Product Images */}
        <div className="space-y-4">
          <Label>Product Images</Label>
          <div className="grid grid-cols-4 gap-4">
            {localData.images.map((image, index) => (
              <div
                key={index}
                className="aspect-square bg-muted rounded-lg overflow-hidden"
              >
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = 
                      `<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Image not available</div>`;
                  }}
                />
              </div>
            ))}
            <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {localData.images.length} images uploaded
          </p>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="productTitle">Product Title</Label>
            <Input
              id="productTitle"
              value={localData.productTitle}
              onChange={(e) =>
                handleFieldChange("productTitle", e.target.value)
              }
              placeholder="Enter product title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={localData.price}
              onChange={(e) =>
                handleFieldChange("price", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishingStatus">Publishing Status</Label>
            <Input
              id="publishingStatus"
              value={localData.publishingStatus}
              onChange={(e) =>
                handleFieldChange("publishingStatus", e.target.value)
              }
              placeholder="Draft"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={localData.brand}
              onChange={(e) => handleFieldChange("brand", e.target.value)}
              placeholder="Enter brand"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={localData.category}
              onChange={(e) => handleFieldChange("category", e.target.value)}
              placeholder="Enter category"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemCondition">Item Condition</Label>
            <Input
              id="itemCondition"
              value={localData.itemCondition}
              onChange={(e) =>
                handleFieldChange("itemCondition", e.target.value)
              }
              placeholder="Enter condition"
            />
          </div>
        </div>

        {/* Product Description */}
        <div className="space-y-2">
          <Label htmlFor="productDescription">Product Description</Label>
          <Textarea
            id="productDescription"
            value={localData.productDescription}
            onChange={(e) =>
              handleFieldChange("productDescription", e.target.value)
            }
            placeholder="Enter detailed product description"
            rows={4}
          />
        </div>

        {/* Key Features */}
        <div className="space-y-4">
          <Label>Key Features</Label>
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add key feature"
              onKeyPress={(e) => e.key === "Enter" && addFeature()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addFeature}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {localData.keyFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <span className="text-sm">{feature}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(feature)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Publishing Channels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Publishing Channels</Label>
            <Badge variant="secondary">
              {getSelectedChannelsCount()} selected
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(localData.channels).map(([channel, checked]) => (
              <div key={channel} className="flex items-center space-x-2">
                <Checkbox
                  id={channel}
                  checked={checked}
                  onCheckedChange={(checked) =>
                    handleChannelChange(
                                                channel as keyof ProductListingData["channels"],
                      checked as boolean
                    )
                  }
                />
                <Label
                  htmlFor={channel}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </Label>
              </div>
            ))}
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
              Save Draft
            </Button>
          </div>
          <Button onClick={onPublish}>
            <Send className="h-4 w-4 mr-2" />
            Publish Listing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
