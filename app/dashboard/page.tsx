"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { PhotoUpload } from "@/components/photo-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Package,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DashboardStats,
  ProductItem,
  DashboardFilters,
  ProductPipelineStatus,
} from "@/lib/types";

// Mock data with updated structure
const mockStats: DashboardStats = {
  totalProcessing: 2,
  totalPaused: 0,
  totalError: 1,
  totalCompleted: 1,
  totalPublished: 0,
};

const mockProducts: ProductItem[] = [
  {
    id: "1",
    name: "iPhone 13 Pro Max",
    model: "Apple iPhone 13 Pro Max 128GB",
    status: "completed",
    currentPhase: 4,
    progress: 100,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T11:15:00Z",
    price: 899,
    platforms: ["wordpress", "facebook"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
  {
    id: "2",
    name: "MacBook Air M2",
    model: "Apple MacBook Air M2 256GB",
    status: "processing",
    currentPhase: 3,
    progress: 65,
    createdAt: "2024-01-15T09:45:00Z",
    updatedAt: "2024-01-15T11:10:00Z",
    platforms: ["wordpress", "facebook", "ebay"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
  {
    id: "3",
    name: "Sony WH-1000XM4",
    model: "Sony WH-1000XM4 Wireless Headphones",
    status: "error",
    currentPhase: 2,
    progress: 25,
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    error: "Failed to fetch product specifications from manufacturer API",
    platforms: ["wordpress", "facebook"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
  {
    id: "4",
    name: "iPad Pro 12.9",
    model: "Apple iPad Pro 12.9-inch M2",
    status: "processing",
    currentPhase: 1,
    progress: 0,
    createdAt: "2024-01-15T08:15:00Z",
    updatedAt: "2024-01-15T08:30:00Z",
    platforms: ["wordpress"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
  {
    id: "5",
    name: "Samsung Galaxy S24 Ultra",
    model: "Samsung Galaxy S24 Ultra 512GB",
    status: "completed",
    currentPhase: 4,
    progress: 100,
    createdAt: "2024-01-13T14:20:00Z",
    updatedAt: "2024-01-13T18:45:00Z",
    price: 1199,
    platforms: ["wordpress", "ebay"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
  {
    id: "6",
    name: "AirPods Pro 2nd Gen",
    model: "Apple AirPods Pro (2nd Generation)",
    status: "processing",
    currentPhase: 2,
    progress: 45,
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T10:15:00Z",
    platforms: ["wordpress", "facebook"],
    thumbnailUrl: "/api/placeholder/80/80",
  },
];

const statusConfig = {
  uploading: {
    label: "Uploading",
    icon: Activity,
    variant: "secondary" as const,
  },
  processing: {
    label: "Processing",
    icon: Clock,
    variant: "secondary" as const,
  },
  paused: {
    label: "Paused",
    icon: Clock,
    variant: "secondary" as const,
  },
  completed: {
    label: "Complete",
    icon: CheckCircle,
    variant: "default" as const,
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
  published: {
    label: "Published",
    icon: TrendingUp,
    variant: "default" as const,
  },
};

const phaseLabels = {
  1: "Analysis",
  2: "Pricing",
  3: "SEO",
  4: "Review",
};

export default function Dashboard() {
  const router = useRouter();
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    search: "",
    page: 1,
    itemsPerPage: 3,
  });

  const filteredProducts = mockProducts.filter((product) => {
    const matchesStatus =
      filters.status === "all" || product.status === filters.status;
    const matchesSearch =
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.model.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / filters.itemsPerPage);
  const startIndex = (filters.page - 1) * filters.itemsPerPage;
  const endIndex = startIndex + filters.itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const getStatusCount = (status: ProductPipelineStatus) => {
    return mockProducts.filter((p) => p.status === status).length;
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusChange = (status: ProductPipelineStatus | "all") => {
    setFilters((prev) => ({ ...prev, status, page: 1 })); // Reset to page 1 when filtering
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 })); // Reset to page 1 when searching
  };

  const handleProductClick = (productId: string) => {
    router.push(`/dashboard/pipeline/${productId}`);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Warehouse Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              5-Stage Product Processing Pipeline
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pipeline Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockProducts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.totalProcessing}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.totalCompleted}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Errors
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalError}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Product Images</CardTitle>
            <CardDescription>
              Drag and drop images or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload />
          </CardContent>
        </Card>

        {/* Product Management */}
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Product Management</CardTitle>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs
              value={filters.status}
              onValueChange={(value) =>
                handleStatusChange(value as ProductPipelineStatus | "all")
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All ({mockProducts.length})
                </TabsTrigger>
                <TabsTrigger value="processing" className="flex-1">
                  Processing ({getStatusCount("processing")})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">
                  Completed ({getStatusCount("completed")})
                </TabsTrigger>
                <TabsTrigger value="error" className="flex-1">
                  Errors ({getStatusCount("error")})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedProducts.map((product) => {
                const config = statusConfig[product.status];
                const StatusIcon = config.icon;

                return (
                  <Card
                    key={product.id}
                    className="transition-all hover:shadow-sm cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border flex-shrink-0"
                              onClick={stopPropagation}
                            />
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base truncate">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={config.variant}
                                  className="flex items-center gap-1 text-xs"
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Stage {product.currentPhase}/5
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {product.status === "processing" && (
                              <div className="text-sm font-medium">
                                {product.progress}%
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={stopPropagation}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Status Content */}
                        <div className="space-y-3">
                          {product.status === "completed" && (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>All stages complete</span>
                              <span className="font-semibold text-green-600">
                                $ {product.price}
                              </span>
                              <span className="text-muted-foreground">
                                92% confidence
                              </span>
                            </div>
                          )}

                          {product.status === "processing" && (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {
                                  phaseLabels[
                                    product.currentPhase as keyof typeof phaseLabels
                                  ]
                                }{" "}
                                ({product.currentPhase}/5 completed)
                              </div>
                              <Progress
                                value={product.progress}
                                className="h-2"
                              />
                            </div>
                          )}

                          {product.status === "error" && product.error && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-red-600">
                                Stage {product.currentPhase} Error:
                              </div>
                              <p className="text-sm text-red-600 break-words">
                                {product.error}
                              </p>
                            </div>
                          )}

                          {/* Platform tags */}
                          {product.platforms && (
                            <div className="flex flex-wrap gap-1">
                              {product.platforms.map((platform) => (
                                <Badge
                                  key={platform}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                              Uploaded{" "}
                              {new Date(product.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              Completed{" "}
                              {new Date(product.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-start gap-4">
                        {/* Checkbox and Thumbnail */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            onClick={stopPropagation}
                          />
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {product.name}
                            </h3>
                            <Badge
                              variant={config.variant}
                              className="flex items-center gap-1"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Stage {product.currentPhase}/5
                            </span>
                          </div>

                          {/* Status specific content */}
                          {product.status === "completed" && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>All stages complete</span>
                                <span className="font-semibold text-green-600">
                                  $ {product.price}
                                </span>
                                <span className="text-muted-foreground">
                                  92% confidence
                                </span>
                              </div>
                            </div>
                          )}

                          {product.status === "processing" && (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {
                                  phaseLabels[
                                    product.currentPhase as keyof typeof phaseLabels
                                  ]
                                }{" "}
                                ({product.currentPhase}/5 completed)
                              </div>
                              <Progress
                                value={product.progress}
                                className="h-2"
                              />
                            </div>
                          )}

                          {product.status === "error" && product.error && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-red-600">
                                Stage {product.currentPhase} Error:
                              </div>
                              <p className="text-sm text-red-600">
                                {product.error}
                              </p>
                            </div>
                          )}

                          {/* Platform tags */}
                          {product.platforms && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {product.platforms.map((platform) => (
                                <Badge
                                  key={platform}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions and Timestamp */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {product.status === "processing" && (
                            <div className="text-right text-sm font-medium">
                              {product.progress}%
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground text-right">
                            <div>
                              Uploaded{" "}
                              {new Date(product.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              Completed{" "}
                              {new Date(product.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={stopPropagation}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  {filters.search || filters.status !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Start by uploading your first product"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t gap-4">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)}{" "}
                  of {totalItems} products
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="hidden sm:flex"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {/* Mobile Previous */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="sm:hidden"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={
                            page === filters.page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0 flex-shrink-0"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="hidden sm:flex"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Mobile Next */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="sm:hidden"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
