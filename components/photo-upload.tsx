"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, Trash2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadDialog } from "@/components/upload-dialog";
import { toast } from "sonner";

interface ProductFormData {
  name: string;
  model: string;
  brand: string;
  category: string;
}

export function PhotoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productData, setProductData] = useState<ProductFormData>({
    name: '',
    model: '',
    brand: '',
    category: ''
  });
  const [uploading, setUploading] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Basic file validation
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFiles = 10;
    
    // Validate files
    const errors: string[] = [];
    
    if (acceptedFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }
    
    acceptedFiles.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed`);
      }
      
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1}: File size too large. Maximum 10MB allowed`);
      }
    });
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setFiles((prev) => {
      const newFiles = [...prev, ...acceptedFiles].slice(0, 10); // Max 10 files
      // Create preview URLs for all files
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
      return newFiles;
    });

    // Show product form if files are added and it's not already visible
    if (acceptedFiles.length > 0 && !showProductForm) {
      setShowProductForm(true);
    }
  }, [showProductForm]);

  // Clean up object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove);

      // Clean up the removed preview URL
      if (previewUrls[indexToRemove]) {
        URL.revokeObjectURL(previewUrls[indexToRemove]);
      }

      // Update preview URLs
      const newPreviewUrls = previewUrls.filter(
        (_, index) => index !== indexToRemove
      );
      setPreviewUrls(newPreviewUrls);

      // Hide product form if no files left
      if (newFiles.length === 0) {
        setShowProductForm(false);
      }

      return newFiles;
    });
  };

  const clearAllFiles = () => {
    // Clean up all preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setFiles([]);
    setShowProductForm(false);
    setProductData({ name: '', model: '', brand: '', category: '' });
  };

  const handleProductDataChange = (field: keyof ProductFormData, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    // Basic file validation before upload
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const errors: string[] = [];
    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type`);
      }
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1}: File too large`);
      }
    });
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setUploading(true);

    try {
      console.log('🚀 Starting upload without authentication...');
      
      // Create FormData for API call
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      
      // Add product metadata (no user_id needed)
      formData.append("name", productData.name || `Product ${Date.now()}`);
      if (productData.model) formData.append("model", productData.model);
      if (productData.brand) formData.append("brand", productData.brand);
      if (productData.category) formData.append("category", productData.category);

      console.log('📤 Sending FormData for', files.length, 'files');

      // Call API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      toast.success('Product uploaded successfully! Processing pipeline started.');

      // Open the upload dialog to show pipeline progress
      setIsDialogOpen(true);

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSuccess = () => {
    // Close dialog and clear files after successful publish
    setIsDialogOpen(false);
    clearAllFiles();
    toast.success('Product processing completed successfully!');
  };

  // Don't render file previews until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-3 sm:p-6">
        <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors border-border hover:border-primary">
          <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground px-2">
            Loading upload interface...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Enhanced Product Information Form - Only show when files are selected */}
      {showProductForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Product Information
              <Badge variant="secondary">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productData.name}
                  onChange={(e) => handleProductDataChange('name', e.target.value)}
                  placeholder="e.g. iPhone 13 Pro Max"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  AI will detect this if left blank
                </p>
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={productData.model}
                  onChange={(e) => handleProductDataChange('model', e.target.value)}
                  placeholder="e.g. A2484, 128GB"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={productData.brand}
                  onChange={(e) => handleProductDataChange('brand', e.target.value)}
                  placeholder="e.g. Apple, Samsung"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={productData.category}
                  onChange={(e) => handleProductDataChange('category', e.target.value)}
                  placeholder="e.g. Smartphone, Electronics"
                />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">AI Enhancement</p>
                  <p>Our AI will automatically detect and enhance this information during Phase 1 processing, even if left blank.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Image Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary"
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground px-2">
              {isDragActive
                ? "Drop the files here..."
                : "Drag 'n' drop some files here, or click to select files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 10 images, 10MB each • Supports JPEG, PNG, WebP
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 sm:mt-6" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-medium">
                  Selected Files:
                  <Badge variant="secondary" className="ml-2">
                    {files.length}/10
                  </Badge>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFiles}
                  className="text-destructive hover:text-destructive/90 h-8 sm:h-9"
                  disabled={uploading}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Clear All</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative group border rounded-lg overflow-hidden hover:border-primary transition-colors"
                  >
                    {/* Primary badge for first image */}
                    {index === 0 && (
                      <Badge 
                        variant="default" 
                        className="absolute top-2 left-2 z-10 text-xs"
                      >
                        Primary
                      </Badge>
                    )}
                    
                    {/* Image Preview */}
                    <div className="aspect-square relative">
                      {previewUrls[index] && (
                        <Image
                          src={previewUrls[index]}
                          alt={`Preview of ${file.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Enhanced Upload Button */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleUpload} 
                  className="flex-1 sm:flex-none"
                  disabled={uploading}
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Starting Pipeline...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start AI Processing Pipeline
                    </>
                  )}
                </Button>
              </div>

              {/* Pipeline Preview */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                <h4 className="font-medium text-sm mb-2">AI Processing Pipeline</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Phase 1: AI Analysis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Phase 2: Data Enrichment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span>Phase 3: Smart Pricing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Phase 4: SEO & Publishing</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog with pipeline tracking */}
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
        files={files}
      />
    </div>
  );
}