"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { ProductAnalysis } from "@/lib/types";

interface ValidationCardProps {
  analysisResult: ProductAnalysis;
  onConfirm: (productInfo: {
    name: string;
    model: string;
    brand: string;
    category: string;
  }) => void;
}

export function ValidationCard({
  analysisResult,
  onConfirm,
}: ValidationCardProps) {
  const [productName, setProductName] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const handleSubmit = () => {
    const productInfo = {
      name: productName.trim() || analysisResult.model || "Unknown Product",
      model: productModel.trim() || analysisResult.model || "Unknown Model", 
      brand: productBrand.trim() || "Generic",
      category: productCategory.trim() || "General"
    };
    onConfirm(productInfo);
  };

  const isValid =
    analysisResult.confidence >= 90 || 
    (productName.trim().length > 0 && productModel.trim().length > 0 && productBrand.trim().length > 0);

  return (
    <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Validation Required
            </CardTitle>
            <CardDescription>
              Please review and confirm the detected product information
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Detected Model
            </Label>
            <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-2 rounded border break-words">
              {analysisResult.model}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Confidence Score
            </Label>
            <div className="flex items-center gap-2">
              <Progress
                value={analysisResult.confidence}
                className="flex-1 h-2"
              />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                {analysisResult.confidence}%
              </span>
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Detected Issues
            </Label>
            <p className="text-sm text-muted-foreground bg-white dark:bg-white/5 p-2 rounded border break-words">
              {analysisResult.defects.length > 0
                ? analysisResult.defects.join(", ")
                : "None detected"}
            </p>
          </div>
        </div>

        {analysisResult.confidence < 90 && (
          <div className="space-y-4 p-3 sm:p-4 bg-amber-100/50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                Please provide the missing product information:
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                The AI confidence is {analysisResult.confidence}% (below 90% threshold). Please fill in the product details to continue.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-sm font-medium">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  className="bg-white dark:bg-white/5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-model" className="text-sm font-medium">
                  Model <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-model"
                  value={productModel}
                  onChange={(e) => setProductModel(e.target.value)}
                  placeholder={analysisResult.model || "e.g. iPhone 15 Pro 128GB"}
                  className="bg-white dark:bg-white/5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-brand" className="text-sm font-medium">
                  Brand <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-brand"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  placeholder="e.g. Apple, Samsung, Sony"
                  className="bg-white dark:bg-white/5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-category" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="product-category"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="e.g. Electronics, Smartphones"
                  className="bg-white dark:bg-white/5"
                />
              </div>
            </div>
          </div>
        )}

        {analysisResult.confidence >= 90 && (
          <div className="p-3 sm:p-4 bg-green-100/50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Very high confidence detection (90%+). The product model looks correct.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
          >
            Confirm & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
