"use client";

import Image from "next/image";
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
import { CheckCircle, Globe, Sparkles, DollarSign, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEOData,
  ProductSpecifications,
  MSRPData,
  ConditionInspection,
  ITEM_CONDITIONS,
  ProductStatus,
} from "@/lib/types";
import { PUBLISHING_PLATFORMS, PRODUCT_STATUS_OPTIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Phase4ResultsProps {
  productListingData: {
    seoData: SEOData;
    specificationsData: ProductSpecifications | null;
    msrpData: MSRPData | null;
    conditionInspection: ConditionInspection;
    customPrice: string;
    selectedPlatforms: string[];
    productStatus: ProductStatus;
    files: File[];
  };
  onPriceChange: (price: string) => void;
  onPlatformToggle: (platformId: string) => void;
  onStatusChange: (status: ProductStatus) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export function Phase4Results({
  productListingData,
  onPriceChange,
  onPlatformToggle,
  onStatusChange,
  onPublish,
  onSaveDraft,
}: Phase4ResultsProps) {
  const itemConditionLabel =
    ITEM_CONDITIONS.find(
      (c) => c.value === productListingData.conditionInspection.itemCondition
    )?.label || productListingData.conditionInspection.itemCondition;

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
                Phase 4 Complete!
              </CardTitle>
              <CardDescription>
                SEO optimization and publishing preparation completed
                successfully
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SEO Content Preview */}
      <Card className="border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">
                SEO Optimization Complete
              </CardTitle>
              <CardDescription>
                AI-generated SEO content for maximum visibility
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                SEO Title
              </Label>
              <p className="text-sm bg-white dark:bg-white/5 p-3 rounded border">
                {productListingData.seoData.title}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                URL Slug
              </Label>
              <p className="text-sm bg-white dark:bg-white/5 p-3 rounded border font-mono">
                /{productListingData.seoData.slug}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              Meta Description
            </Label>
            <p className="text-sm bg-white dark:bg-white/5 p-3 rounded border">
              {productListingData.seoData.metaDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Keywords
              </Label>
              <div className="flex flex-wrap gap-2">
                {productListingData.seoData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 rounded-md text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {productListingData.seoData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Form */}
      <Card className="border-slate-200 dark:border-slate-500/20 bg-slate-50/50 dark:bg-slate-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-500/20">
              <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Product Listing Form
              </CardTitle>
              <CardDescription>
                Complete product information ready for publishing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Images */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productListingData.files.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Product ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productTitle">Product Title</Label>
              <Input
                id="productTitle"
                value={productListingData.seoData.title}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productPrice">Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="productPrice"
                  type="number"
                  value={productListingData.customPrice}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productStatus">Publishing Status</Label>
              <Select
                value={productListingData.productStatus}
                onValueChange={onStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={productListingData.specificationsData?.brand || "N/A"}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={productListingData.specificationsData?.category || "N/A"}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Item Condition</Label>
              <Input
                value={itemConditionLabel}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Condition Details */}
          {productListingData.conditionInspection.productCondition && (
            <div className="space-y-2">
              <Label>Product Condition Details</Label>
              <Input
                value={productListingData.conditionInspection.productCondition}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description</Label>
            <textarea
              id="productDescription"
              value={productListingData.seoData.productDescription}
              readOnly
              className="w-full min-h-[120px] p-3 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 resize-none"
            />
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <Label>Key Features</Label>
            <div className="bg-white dark:bg-white/5 p-4 rounded border">
              <ul className="space-y-2">
                {productListingData.seoData.bulletPoints.map((point, index) => (
                  <li key={index} className="text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technical Specifications */}
          {productListingData.specificationsData && (
            <div className="space-y-2">
              <Label>Technical Specifications</Label>
              <div className="bg-white dark:bg-white/5 p-4 rounded border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(
                    productListingData.specificationsData.technicalSpecs
                  ).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium">{key}:</span>
                      <span className="text-sm text-muted-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Information */}
          <div className="space-y-2">
            <Label>Pricing Information</Label>
            <div className="bg-white dark:bg-white/5 p-4 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Your Price</p>
                  <p className="text-lg font-bold text-green-600">
                    ${productListingData.customPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Retail Price</p>
                  <p className="text-lg">
                    ${productListingData.msrpData?.currentSellingPrice || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Savings</p>
                  <p className="text-lg text-green-600">
                    $
                    {productListingData.msrpData
                      ? (
                          productListingData.msrpData.currentSellingPrice -
                          parseFloat(productListingData.customPrice || "0")
                        ).toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Platforms */}
      <Card className="border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-500/20">
              <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Multi-Channel Publishing
              </CardTitle>
              <CardDescription>
                Select platforms to publish your product listing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PUBLISHING_PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all relative",
                  productListingData.selectedPlatforms.includes(platform.id)
                    ? "border-orange-500 bg-orange-100 dark:bg-orange-500/20"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-500/10",
                  platform.id !== "wordpress" && "opacity-60"
                )}
                onClick={() => onPlatformToggle(platform.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                    {platform.id !== "wordpress" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Work in progress
                      </p>
                    )}
                  </div>
                  {productListingData.selectedPlatforms.includes(
                    platform.id
                  ) && (
                    <CheckCircle className="h-5 w-5 text-orange-600 ml-auto" />
                  )}
                </div>
                {platform.id === "wordpress" && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Ready
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {productListingData.selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Selected platforms:{" "}
                {productListingData.selectedPlatforms
                  .map(
                    (id) => PUBLISHING_PLATFORMS.find((p) => p.id === id)?.name
                  )
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="border-gray-300"
            >
              Save as Draft
            </Button>
            <Button
              onClick={onPublish}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={productListingData.selectedPlatforms.length === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              Publish to {productListingData.selectedPlatforms.length} Platform
              {productListingData.selectedPlatforms.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
