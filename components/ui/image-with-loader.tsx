// components/ui/image-with-loader.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithLoaderProps {
  src?: string;
  alt: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageWithLoader({
  src,
  alt,
  fallbackIcon: FallbackIcon = Package,
  className = "w-full h-full object-cover",
  containerClassName = "",
  showSkeleton = true,
  onLoad,
  onError,
}: ImageWithLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // If no src provided, show fallback immediately
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center", containerClassName)}>
        <FallbackIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Loading skeleton */}
      {loading && showSkeleton && (
        <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Image */}
      {!error && (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover",
            className,
            loading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <FallbackIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Debug indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className={cn(
            "absolute top-0 right-0 w-2 h-2 rounded-full",
            error ? "bg-red-500" : src ? "bg-green-500" : "bg-gray-500"
          )} 
          title={error ? "Image failed" : src ? `Image: ${src}` : "No image"}
        />
      )}
    </div>
  );
}

// Skeleton component for consistent loading states
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted flex items-center justify-center", className)}>
      <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Product image component with specific styling for product cards
export function ProductImage({
  src,
  productName,
  size = "sm"
}: {
  src?: string;
  productName: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20"
  };

  return (
    <ImageWithLoader
      src={src}
      alt={productName}
      containerClassName={cn(
        "bg-muted rounded-lg",
        sizeClasses[size]
      )}
      className="w-full h-full object-cover rounded-lg"
      fallbackIcon={Package}
      showSkeleton={true}
    />
  );
} 