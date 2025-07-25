"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { WooCommerceCategorySelect } from "@/components/ui/woocommerce-category-select";
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  Save,
  ChevronLeft,
  Upload,
  Plus,
  X,
  Package,
  Edit,
  Check,
} from "lucide-react";
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

export interface ProductListingData {
  images: ProductImage[];
  productTitle: string;
  price: number;
  publishingStatus: string;
  brand: string;
  category: string;
  itemCondition: string;
  productDescription: string;
  keyFeatures: string[];
  technicalSpecs?: Record<string, any>;
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
  // Ensure all fields have default values to prevent uncontrolled to controlled input errors
  const normalizeData = (inputData: ProductListingData): ProductListingData => ({
    images: inputData.images ?? [],
    productTitle: inputData.productTitle ?? '',
    price: inputData.price ?? 0,
    publishingStatus: inputData.publishingStatus ?? '',
    brand: inputData.brand ?? '',
    category: inputData.category ?? '',
    itemCondition: inputData.itemCondition ?? '',
    productDescription: inputData.productDescription ?? '',
    keyFeatures: inputData.keyFeatures ?? [],
    technicalSpecs: inputData.technicalSpecs ?? {},
    channels: {
      wordpress: inputData.channels?.wordpress ?? false,
      facebook: inputData.channels?.facebook ?? false,
      ebay: inputData.channels?.ebay ?? false,
      amazon: inputData.channels?.amazon ?? false,
    }
  });
  
  const [localData, setLocalData] = useState(() => normalizeData(data));
  const [newFeature, setNewFeature] = useState("");
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editingFeatureValue, setEditingFeatureValue] = useState("");
  const [newTechSpecKey, setNewTechSpecKey] = useState("");
  const [newTechSpecValue, setNewTechSpecValue] = useState("");
  const [editingTechSpec, setEditingTechSpec] = useState<string | null>(null);
  const [editingTechSpecKey, setEditingTechSpecKey] = useState("");
  const [editingTechSpecValue, setEditingTechSpecValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const params = useParams();
  const productId = params.id as string;
  
  // Update local data when prop data changes
  useEffect(() => {
    const normalizedData = normalizeData(data);
    setLocalData(normalizedData);
  }, [data]);

  const handleFieldChange = (
    field: keyof Omit<ProductListingData, "keyFeatures" | "channels" | "technicalSpecs">,
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

  // Enhanced Key Features Functions
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

  const removeFeature = (index: number) => {
    const newData = {
      ...localData,
      keyFeatures: localData.keyFeatures.filter((_, i) => i !== index),
    };
    setLocalData(newData);
    onUpdate(newData);
    setEditingFeatureIndex(null);
  };

  const startEditingFeature = (index: number, feature: string) => {
    setEditingFeatureIndex(index);
    setEditingFeatureValue(feature);
  };

  const saveFeatureEdit = (index: number) => {
    if (editingFeatureValue.trim()) {
      const newFeatures = [...localData.keyFeatures];
      newFeatures[index] = editingFeatureValue.trim();
      const newData = {
        ...localData,
        keyFeatures: newFeatures,
      };
      setLocalData(newData);
      onUpdate(newData);
    }
    setEditingFeatureIndex(null);
    setEditingFeatureValue("");
  };

  const cancelFeatureEdit = () => {
    setEditingFeatureIndex(null);
    setEditingFeatureValue("");
  };

  // Technical Specifications Functions
  const addTechnicalSpec = () => {
    if (newTechSpecKey.trim() && newTechSpecValue.trim()) {
      const newData = {
        ...localData,
        technicalSpecs: {
          ...localData.technicalSpecs,
          [newTechSpecKey.trim()]: newTechSpecValue.trim(),
        },
      };
      setLocalData(newData);
      onUpdate(newData);
      setNewTechSpecKey("");
      setNewTechSpecValue("");
    }
  };

  const removeTechnicalSpec = (key: string) => {
    const newSpecs = { ...localData.technicalSpecs };
    delete newSpecs[key];
    const newData = {
      ...localData,
      technicalSpecs: newSpecs,
    };
    setLocalData(newData);
    onUpdate(newData);
    setEditingTechSpec(null);
  };

  const startEditingTechSpec = (key: string, value: string) => {
    setEditingTechSpec(key);
    setEditingTechSpecKey(key);
    setEditingTechSpecValue(typeof value === 'object' ? JSON.stringify(value) : String(value));
  };

  const saveTechSpecEdit = (originalKey: string) => {
    if (editingTechSpecKey.trim() && editingTechSpecValue.trim()) {
      const newSpecs = { ...localData.technicalSpecs };
      
      // Remove old key if key was changed
      if (originalKey !== editingTechSpecKey.trim()) {
        delete newSpecs[originalKey];
      }
      
      // Add with new key and value
      newSpecs[editingTechSpecKey.trim()] = editingTechSpecValue.trim();
      
      const newData = {
        ...localData,
        technicalSpecs: newSpecs,
      };
      setLocalData(newData);
      onUpdate(newData);
    }
    setEditingTechSpec(null);
    setEditingTechSpecKey("");
    setEditingTechSpecValue("");
  };

  const cancelTechSpecEdit = () => {
    setEditingTechSpec(null);
    setEditingTechSpecKey("");
    setEditingTechSpecValue("");
  };

  const getSelectedChannelsCount = () => {
    return Object.values(localData.channels).filter(Boolean).length;
  };

  const handleSave = async () => {
    if (!productId || isSaving) return;

    setIsSaving(true);
    try {
      // Ensure technicalSpecs is properly initialized
      const dataToSave = {
        ...localData,
        technicalSpecs: localData.technicalSpecs || {}
      };

      console.log('🔧 [PHASE4-FORM] Saving Phase 4 data:', dataToSave);

      const response = await fetch(`/api/products/${productId}/phase4`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ [PHASE4-FORM] Non-JSON response:', textResponse);
        throw new Error('Server returned an invalid response format. Please check the server logs.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Save failed with status ${response.status}`);
      }

      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        toast.success('✅ Phase 4 data saved successfully!');
        onSave(); // Call the original onSave callback
        console.log('✅ [PHASE4-FORM] Save successful:', result);
      } else {
        throw new Error(result.error || 'Save operation failed');
      }

    } catch (error) {
      console.error('❌ [PHASE4-FORM] Save error:', error);
      toast.error(`Failed to save Phase 4 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (!productId || isUploadingImages) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxTotalImages = 10;
    
    // Validate files
    const errors: string[] = [];
    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed`);
      }
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1}: File size too large. Maximum 10MB allowed`);
      }
    });

    // Check total image count
    const totalImages = localData.images.length + files.length;
    if (totalImages > maxTotalImages) {
      errors.push(`Maximum ${maxTotalImages} images allowed. You currently have ${localData.images.length} images.`);
    }
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsUploadingImages(true);
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      formData.append("productId", productId);

             console.log('📤 [PHASE4] Uploading', files.length, 'additional images for product:', productId);
       console.log('📤 [PHASE4] API URL:', `/api/products/${productId}/images`);
       console.log('📤 [PHASE4] Form data files:', Array.from(formData.entries()));

       const response = await fetch(`/api/products/${productId}/images`, {
         method: 'POST',
         body: formData,
       });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (result.success && result.images) {
        // Add new images to the current product data
        const newImages = result.images.map((imageUrl: string, index: number) => ({
          id: `uploaded-${Date.now()}-${index}`,
          imageUrl,
          fileName: files[index].name,
          fileSize: files[index].size,
          isPrimary: false
        }));

        const updatedData = {
          ...localData,
          images: [...localData.images, ...newImages]
        };

        setLocalData(updatedData);
        onUpdate(updatedData);
        
        toast.success(`✅ Successfully uploaded ${files.length} image(s)!`);
      } else {
        throw new Error('Upload succeeded but no image URLs returned');
      }

    } catch (error) {
      console.error('❌ [PHASE4] Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Failed to upload images: ${errorMessage}`);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        handleImageUpload(files);
      }
    };
    input.click();
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
                key={image.id || index}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden"
              >
                {/* ImageWithLoader component would go here if it were imported */}
                <img
                  src={image.imageUrl}
                  alt={image.fileName || `Product image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={triggerImageUpload}
              disabled={isUploadingImages}
              className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-muted-foreground/50 hover:bg-muted/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImages ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground"></div>
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              ) : (
                <Plus className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
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
            <WooCommerceCategorySelect
              id="category"
              label="Category"
              value={localData.category}
              onChange={(value) => handleFieldChange("category", value)}
              placeholder="Select or enter category"
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
            {localData.keyFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-muted rounded"
              >
                {editingFeatureIndex === index ? (
                  <>
                    <Input
                      value={editingFeatureValue}
                      onChange={(e) => setEditingFeatureValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") saveFeatureEdit(index);
                        if (e.key === "Escape") cancelFeatureEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => saveFeatureEdit(index)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelFeatureEdit}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingFeature(index, feature)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="space-y-4">
          <Label>Technical Specifications</Label>
          
          {/* Add new technical specification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              value={newTechSpecKey}
              onChange={(e) => setNewTechSpecKey(e.target.value)}
              placeholder="Specification name (e.g., Weight, Dimensions)"
            />
            <div className="flex gap-2">
              <Input
                value={newTechSpecValue}
                onChange={(e) => setNewTechSpecValue(e.target.value)}
                placeholder="Specification value"
                onKeyPress={(e) => e.key === "Enter" && addTechnicalSpec()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTechnicalSpec}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            {localData.technicalSpecs && Object.keys(localData.technicalSpecs).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(localData.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-background rounded border">
                    {editingTechSpec === key ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                          <Input
                            value={editingTechSpecKey}
                            onChange={(e) => setEditingTechSpecKey(e.target.value)}
                            placeholder="Specification name"
                            className="text-sm"
                          />
                          <Input
                            value={editingTechSpecValue}
                            onChange={(e) => setEditingTechSpecValue(e.target.value)}
                            placeholder="Specification value"
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") saveTechSpecEdit(key);
                              if (e.key === "Escape") cancelTechSpecEdit();
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => saveTechSpecEdit(key)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelTechSpecEdit}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key}
                          </span>
                          <span className="text-sm">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingTechSpec(key, value)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTechnicalSpec(key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No technical specifications available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add technical specifications using the form above
                </p>
              </div>
            )}
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
                <Switch
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
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            {lastSaved && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Saved at {lastSaved}</span>
              </div>
            )}
          </div>
          <Button onClick={onPublish}>
            {/* Send icon was removed from imports, so using Plus for now */}
            <Plus className="h-4 w-4 mr-2" />
            Publish Listing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
