"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Plus,
  Save,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Database,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

// Phase completion status
type PhaseStatus = "pending" | "running" | "completed" | "failed";

interface PhaseState {
  status: PhaseStatus;
  isRunning: boolean;
}

export interface SEOAnalysisData {
  seoTitle: string;
  urlSlug: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
}

interface Phase3FormProps {
  data: SEOAnalysisData;
  onUpdate: (data: SEOAnalysisData) => void;
  onSave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  phaseState: PhaseState;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  canStart: boolean;
}

export function Phase3Form({
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
}: Phase3FormProps) {
  // Ensure all fields have default values to prevent uncontrolled to controlled input errors
  const normalizeData = (inputData: SEOAnalysisData): SEOAnalysisData => ({
    seoTitle: inputData.seoTitle ?? '',
    urlSlug: inputData.urlSlug ?? '',
    metaDescription: inputData.metaDescription ?? '',
    keywords: inputData.keywords ?? [],
    tags: inputData.tags ?? [],
  });

  const [localData, setLocalData] = useState(() => normalizeData(data));
  const [newKeyword, setNewKeyword] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const params = useParams();
  const productId = params.id as string;

  // Update local data when props change
  useEffect(() => {
    const normalizedData = normalizeData(data);
    setLocalData(normalizedData);
  }, [data]);

  const handleFieldChange = (
    field: keyof Omit<SEOAnalysisData, "keywords" | "tags">,
    value: string
  ) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !localData.keywords.includes(newKeyword.trim())) {
      const newData = {
        ...localData,
        keywords: [...localData.keywords, newKeyword.trim()],
      };
      setLocalData(newData);
      onUpdate(newData);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const newData = {
      ...localData,
      keywords: localData.keywords.filter((k) => k !== keyword),
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const addTag = () => {
    if (newTag.trim() && !localData.tags.includes(newTag.trim())) {
      const newData = {
        ...localData,
        tags: [...localData.tags, newTag.trim()],
      };
      setLocalData(newData);
      onUpdate(newData);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    const newData = {
      ...localData,
      tags: localData.tags.filter((t) => t !== tag),
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const generateSlug = () => {
    const slug = localData.seoTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    handleFieldChange("urlSlug", slug);
  };

  const handleSave = async () => {
    if (!productId || isSaving) return;

    setIsSaving(true);
    try {
      console.log('🔧 [PHASE3-FORM] Saving Phase 3 data:', localData);

      const response = await fetch(`/api/products/${productId}/phase3`, {
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
        toast.success('✅ Phase 3 data saved successfully!');
        onSave(); // Call the original onSave callback
        console.log('✅ [PHASE3-FORM] Save successful:', result);
      } else {
        throw new Error(result.error || 'Save operation failed');
      }

    } catch (error) {
      console.error('❌ [PHASE3-FORM] Save error:', error);
      toast.error(`Failed to save Phase 3 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          Start SEO Analysis
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
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">SEO Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Content optimization and search engine optimization
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
        {/* SEO Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <span className="text-sm text-muted-foreground">
              {localData.seoTitle.length}/60
            </span>
          </div>
          <Input
            id="seoTitle"
            value={localData.seoTitle}
            onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
            placeholder="Enter SEO-optimized title"
            maxLength={60}
          />
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="urlSlug">URL Slug</Label>
          <div className="flex gap-2">
            <Input
              id="urlSlug"
              value={localData.urlSlug}
              onChange={(e) => handleFieldChange("urlSlug", e.target.value)}
              placeholder="url-slug"
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateSlug}
              size="sm"
            >
              Auto-generate
            </Button>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <span className="text-sm text-muted-foreground">
              {localData.metaDescription.length}/160
            </span>
          </div>
          <Textarea
            id="metaDescription"
            value={localData.metaDescription}
            onChange={(e) =>
              handleFieldChange("metaDescription", e.target.value)
            }
            placeholder="Enter meta description for search engines"
            rows={3}
            maxLength={160}
          />
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label>Keywords</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword"
              onKeyPress={(e) => e.key === "Enter" && addKeyword()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addKeyword}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localData.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary">
                {keyword}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => removeKeyword(keyword)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              onKeyPress={(e) => e.key === "Enter" && addTag()}
            />
            <Button type="button" variant="outline" onClick={addTag} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localData.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
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
            Continue to Product Listing
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {/* SEO Data Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO Analysis Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Content Optimization</p>
              <p>Title Length: {localData.seoTitle.length} characters</p>
              <p>Meta Description: {localData.metaDescription.length} characters</p>
              <p>Keywords: {localData.keywords.length} defined</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">SEO Elements</p>
              <p>URL Slug: {localData.urlSlug}</p>
              <p>Tags: {localData.tags.length} defined</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {localData.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3 w-3" />
              SEO data from seo_analysis_data table, enhanced with product info
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
