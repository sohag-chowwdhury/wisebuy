"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, Trash2, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadDialog } from "@/components/upload-dialog";
import { ImageWithLoader } from "@/components/ui/image-with-loader";
import { toast } from "sonner";

export function PhotoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addFilesToCollection(acceptedFiles);
  }, []);

  const addFilesToCollection = useCallback((newFiles: File[]) => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFiles = 10;
    
    const errors: string[] = [];
    
    if (newFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }
    
    newFiles.forEach((file, index) => {
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
      const totalFiles = prev.length + newFiles.length;
      if (totalFiles > maxFiles) {
        toast.error(`Cannot add ${newFiles.length} files. Maximum ${maxFiles} files allowed. Currently have ${prev.length} files.`);
        return prev;
      }
      
      const updatedFiles = [...prev, ...newFiles];
      const newPreviewUrls = updatedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
      return updatedFiles;
    });
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions and try again.');
      toast.error('Camera access denied or not available');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraError(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      toast.error('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast.error('Unable to capture photo');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to capture photo');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `camera-photo-${timestamp}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      addFilesToCollection([file]);
      toast.success('Photo captured successfully!');
    }, 'image/jpeg', 0.9);
  }, [stream, addFilesToCollection]);

  const openCamera = () => {
    setIsCameraOpen(true);
    startCamera();
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

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

      if (previewUrls[indexToRemove]) {
        URL.revokeObjectURL(previewUrls[indexToRemove]);
      }

      const newPreviewUrls = previewUrls.filter(
        (_, index) => index !== indexToRemove
      );
      setPreviewUrls(newPreviewUrls);

      return newFiles;
    });
  };

  const clearAllFiles = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setFiles([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

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
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      
      console.log('📤 Sending FormData for', files.length, 'files');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed');
      }

      if (responseData.requiresManualInput) {
        toast.warning(responseData.message || 'Manual input required - please provide product details');
        setIsDialogOpen(true);
      } else {
        toast.success('✅ Product uploaded! AI is analyzing images in the background.');
        clearAllFiles();
      }

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    clearAllFiles();
    toast.success('Product processing completed successfully!');
  };



  if (!mounted) {
    return (
      <div className="p-6">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading upload interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary"
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive ? "Drop files here" : "Drag 'n' drop files or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10 images, 10MB each • Supports JPEG, PNG, WebP
              </p>
            </div>

            {/* Camera */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Take photos with your camera
              </p>
              <Button 
                onClick={openCamera}
                variant="outline"
                className="mt-3"
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Open Camera
              </Button>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Selected Files ({files.length}/10)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFiles}
                  className="text-destructive hover:text-destructive"
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative group border rounded-lg overflow-hidden"
                  >
                    {index === 0 && (
                      <Badge variant="default" className="absolute top-2 left-2 z-10 text-xs">
                        Primary
                      </Badge>
                    )}
                    
                    {file.name.startsWith('camera-photo-') && (
                      <Badge variant="outline" className="absolute top-2 right-8 z-10 text-xs">
                        📷
                      </Badge>
                    )}
                    
                    <div className="aspect-square relative">
                      <ImageWithLoader
                        src={previewUrls[index]}
                        alt={`Preview of ${file.name}`}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        showSkeleton={true}
                      />
                    </div>

                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {file.name.startsWith('camera-photo-') ? 'Camera Photo' : file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

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

              <div className="flex justify-center">
                <Button 
                  onClick={handleUpload} 
                  size="lg"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={closeCamera}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Take Product Photos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {cameraError ? (
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <div className="text-center">
                  <CameraOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                  <Button onClick={startCamera} variant="outline" className="mt-2">
                    <Camera className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-96 object-cover"
                  />
                  {stream && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button 
                        onClick={capturePhoto}
                        size="lg"
                        className="rounded-full h-16 w-16 p-0"
                      >
                        <Camera className="h-6 w-6" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Position your product in the camera view and click the camera button to capture</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={closeCamera}>
                    Close Camera
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Photos captured: {files.filter(f => f.name.startsWith('camera-photo-')).length}
                  </div>
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>

      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
        files={files}
      />
    </div>
  );
}