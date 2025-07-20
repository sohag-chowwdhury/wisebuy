"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "@/components/upload-dialog";

export function PhotoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => {
      const newFiles = [...prev, ...acceptedFiles];
      // Create preview URLs for all files
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
      return newFiles;
    });
  }, []);

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

      return newFiles;
    });
  };

  const clearAllFiles = () => {
    // Clean up all preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setFiles([]);
  };

  const handleUpload = () => {
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    // Close dialog and clear files after successful publish
    setIsDialogOpen(false);
    clearAllFiles();
  };

  // Don't render file previews until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-3 sm:p-6">
        <div
          className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors border-border hover:border-primary"
        >
          <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground px-2">
            Drag and drop some files here, or click to select files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
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
      </div>

      {files.length > 0 && (
        <div className="mt-4 sm:mt-6" suppressHydrationWarning>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium">
              Selected Files:
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="text-destructive hover:text-destructive/90 h-8 sm:h-9"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Clear All</span>
            </Button>
          </div>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-2 sm:p-3 rounded-md bg-muted/50"
              >
                {/* Image Preview */}
                <div className="shrink-0 relative w-10 h-10 sm:w-12 sm:h-12">
                  {previewUrls[index] && (
                    <Image
                      src={previewUrls[index]}
                      alt={`Preview of ${file.name}`}
                      fill
                      className="object-cover rounded border"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  )}
                </div>

                {/* File Info */}
                <span className="text-xs sm:text-sm text-muted-foreground flex-1 truncate pr-2">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 shrink-0"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} className="w-full sm:w-auto">
              Upload {files.length} {files.length === 1 ? "file" : "files"}
            </Button>
          </div>
        </div>
      )}

      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
        files={files}
      />
    </div>
  );
}