"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { PhotoUpload } from "@/components/photo-upload";
import { useProducts } from "@/lib/supabase/hooks";
import { RealTimePipelineStatus } from "@/components/real-time-pipeline-status";
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
import { toast } from "sonner";
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
  Database,
} from "lucide-react";
import {
  DashboardStats,
  ProductItem,
  DashboardFilters,
  ProductPipelineStatus,
} from "@/lib/types";

// API Data Management
interface DashboardData {
  stats: DashboardStats;
  products: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusConfig = {
  uploaded: {
    label: "Uploaded",
    icon: Activity,
    variant: "secondary" as const,
  },
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
  phase_1: {
    label: "Phase 1",
    icon: Clock,
    variant: "secondary" as const,
  },
  phase_2: {
    label: "Phase 2",
    icon: Clock,
    variant: "secondary" as const,
  },
  phase_3: {
    label: "Phase 3",
    icon: Clock,
    variant: "secondary" as const,
  },
  phase_4: {
    label: "Phase 4",
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
  published: {
    label: "Published",
    icon: TrendingUp,
    variant: "default" as const,
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    variant: "destructive" as const,
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
  
  // Real-time products hook for live updates
  const { products: realtimeProducts, loading: productsLoading, error: productsError } = useProducts();
  
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    search: "",
    page: 1,
    itemsPerPage: 25,  // Show more products per page to see all
  });
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalProducts: 0,
      totalProcessing: 0,
      totalPaused: 0,
      totalError: 0,
      totalCompleted: 0,
      totalPublished: 0,
    },
    products: [],
    pagination: {
      page: 1,
      limit: 3,
      total: 0,
      totalPages: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const stats = await response.json();
      setDashboardData(prev => ({ ...prev, stats }));
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  };

  // Fetch dashboard products
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.itemsPerPage.toString(),
      });
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/dashboard/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setDashboardData(prev => ({ 
        ...prev, 
        products: data.products,
        pagination: data.pagination 
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    }
  };

  // Fetch stats from API
  const refreshStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const stats = await response.json();
        setDashboardData(prev => ({ ...prev, stats }));
        console.log('📊 [Dashboard] Stats refreshed from API:', stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial stats fetch only - rely on real-time updates for changes
  useEffect(() => {
    refreshStats();
  }, []);

  // Update dashboard data when real-time products change
  useEffect(() => {
    console.log('📊 [Dashboard] useEffect triggered:', {
      realtimeProducts: realtimeProducts?.length || 0,
      productsLoading,
      productsError,
    });

    if (realtimeProducts && realtimeProducts.length > 0) {
      console.log('✅ [Dashboard] Processing', realtimeProducts.length, 'products');
      console.log('📊 [Dashboard] Product statuses:', realtimeProducts.map(p => ({ id: p.id, name: p.name, status: p.status })));
      
      // Don't refresh stats - use real-time calculated stats instead
      
      // Calculate real-time stats from products as fallback
      const processingStatuses = ['uploaded', 'processing', 'phase_1', 'phase_2', 'phase_3', 'phase_4'];
      const stats = {
        totalProducts: realtimeProducts.length, // ← Fixed: Include total count
        totalProcessing: realtimeProducts.filter(p => processingStatuses.includes(p.status)).length,
        totalPaused: realtimeProducts.filter(p => p.status === 'paused').length,
        totalError: realtimeProducts.filter(p => p.status === 'error').length,
        totalCompleted: realtimeProducts.filter(p => p.status === 'completed').length,
        totalPublished: realtimeProducts.filter(p => p.status === 'published').length,
      };
      
      // Apply filters to products
      let filteredProducts = realtimeProducts;
      
      if (filters.status !== "all") {
        filteredProducts = realtimeProducts.filter(p => p.status === filters.status);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name?.toLowerCase().includes(searchTerm) ||
          p.model?.toLowerCase().includes(searchTerm) ||
          p.brand?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Calculate pagination
      const totalFiltered = filteredProducts.length;
      const totalPages = Math.ceil(totalFiltered / filters.itemsPerPage);
      const startIndex = (filters.page - 1) * filters.itemsPerPage;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + filters.itemsPerPage);
      
      setDashboardData({
        stats,
        products: paginatedProducts.map(p => ({
          id: p.id,
          name: p.name || 'Untitled Product',
          model: p.model || 'Unknown Model',
          status: p.status as ProductPipelineStatus,
          currentPhase: (p.current_phase || 1) as any, // Type fix - will be properly typed later
          progress: p.progress || 0,
          imageUrl: '', // Will be populated from images if needed
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          isProcessing: p.status === 'processing',
          aiConfidence: p.ai_confidence || 0,
        })),
        pagination: {
          page: filters.page,
          limit: filters.itemsPerPage,
          total: totalFiltered,
          totalPages,
        },
      });
    } else {
      console.log('❌ [Dashboard] No products found or empty array');
      // Set empty state but keep existing pagination structure
      setDashboardData(prev => ({
        ...prev,
        products: [],
        stats: {
          totalProducts: 0, // ← Fixed: Include total count in empty state too
          totalProcessing: 0,
          totalPaused: 0,
          totalError: 0,
          totalCompleted: 0,
          totalPublished: 0,
        }
      }));
    }
    
    setIsLoading(productsLoading);
    setError(productsError);
  }, [realtimeProducts, filters, productsLoading, productsError]);

  // Use the products from state (already filtered and paginated by API)
  const paginatedProducts = dashboardData.products;
  const { pagination } = dashboardData;

  const getStatusCount = (status: ProductPipelineStatus) => {
    // For now, we calculate this from the stats data
    switch (status) {
      case 'processing':
        return dashboardData.stats.totalProcessing;
      case 'completed':
        return dashboardData.stats.totalCompleted;
      case 'error':
        return dashboardData.stats.totalError;
      case 'paused':
        return dashboardData.stats.totalPaused;
      case 'published':
        return dashboardData.stats.totalPublished;
      default:
        return 0;
    }
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

  const handleMarketResearch = async (productId: string, productName: string) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(`🔍 Researching ${productName} on Amazon & eBay...`);
      
      console.log('🚀 [DASHBOARD] Starting market research for:', productId, productName);
      
      // Call the market research API
      const response = await fetch(`/api/dashboard/products/${productId}/research`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        const urlTypeEmoji = result.urlType === 'real' ? '🌐' : '⚠️';
        const urlTypeText = result.urlType === 'real' ? 'REAL URLs' : 'FAKE URLs';
        
        toast.success(
          `✅ Research completed! Found ${result.data.amazonResults + result.data.ebayResults} results (${urlTypeText}). Average price: $${result.data.averagePrice.toFixed(2)}`
        );
        
        // Show warning for fake URLs
        if (result.urlType === 'fake' && result.warning) {
          setTimeout(() => {
            toast.warning(
              `${urlTypeEmoji} ${result.warning} Add SerpAPI or eBay API keys for working URLs.`,
              { duration: 8000 }
            );
          }, 2000);
        }
        
        // Refresh the dashboard data
        await fetchProducts();
        
        console.log('✅ [DASHBOARD] Market research completed:', result.data);
      } else {
        toast.error(`❌ Research failed: ${result.message}`);
      }
      
    } catch (error) {
      toast.dismiss();
      console.error('❌ [DASHBOARD] Market research error:', error);
      toast.error(`❌ Failed to research ${productName}. Please try again.`);
    }
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  const response = await fetch('/api/force-refresh', { method: 'POST' });
                  const result = await response.json();
                  if (result.success) {
                    toast.success(`${result.message}`);
                  } else {
                    toast.error(result.error || 'Failed to refresh');
                  }
                } catch (error) {
                  toast.error('Error refreshing dashboard');
                }
              }}
            >
              <Activity className="h-4 w-4" />
              Fix & Refresh
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  const response = await fetch('/api/migrate-market-fields', { method: 'POST' });
                  const result = await response.json();
                  if (result.success) {
                    toast.success(`Database updated! Added: ${result.fieldsAdded.join(', ')}`);
                  } else {
                    toast.error(result.error || 'Migration failed');
                  }
                } catch (error) {
                  toast.error('Error running migration');
                }
              }}
            >
                             <Database className="h-4 w-4" />
               Update Schema
             </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  const response = await fetch('/api/populate-market-fields', { method: 'POST' });
                  const result = await response.json();
                  if (result.success) {
                    toast.success(`Data populated! Updated ${result.recordsUpdated} of ${result.recordsProcessed} records`);
                  } else {
                    toast.error(result.error || 'Population failed');
                  }
                } catch (error) {
                  toast.error('Error populating data');
                }
              }}
            >
              <Package className="h-4 w-4" />
              Fill Data
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pipeline Settings
            </Button>
          </div>
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
              <div className="text-2xl font-bold">{dashboardData.stats.totalProducts}</div>
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
                {dashboardData.stats.totalProcessing}
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
                {dashboardData.stats.totalCompleted}
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
              <div className="text-2xl font-bold">{dashboardData.stats.totalError}</div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Pipeline Status */}
        <RealTimePipelineStatus />

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
                  All ({pagination.total})
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
                const config = statusConfig[product.status] || {
                  label: product.status || "Unknown",
                  icon: Package,
                  variant: "secondary" as const,
                };
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
                              {product.price && (
                                <span className="font-semibold text-green-600">
                                  $ {product.price}
                                </span>
                              )}
                              {product.analysisData?.confidence && (
                                <span className="text-muted-foreground">
                                  {product.analysisData.confidence}% confidence
                                </span>
                              )}
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
                                ({product.currentPhase}/4 completed)
                              </div>
                              <Progress
                                value={product.progress}
                                className="h-2"
                              />
                              
                              {/* Show current phase analysis data on mobile */}
                              {product.analysisData?.confidence && product.currentPhase >= 1 && (
                                <div className="text-xs text-muted-foreground">
                                  AI Analysis: {product.analysisData.confidence}% • {product.analysisData.condition || 'condition unknown'}
                                </div>
                              )}
                              
                              {product.marketData?.averagePrice && product.currentPhase >= 2 && (
                                <div className="text-xs text-muted-foreground">
                                  Market: ${product.marketData.averagePrice} • {product.marketData.marketDemand || 'demand unknown'}
                                </div>
                              )}
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
                                {product.analysisData?.confidence && (
                                  <span className="text-muted-foreground">
                                    {product.analysisData.confidence}% confidence
                                  </span>
                                )}
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
                                ({product.currentPhase}/4 completed)
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
                                                      <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  stopPropagation(e);
                                  handleMarketResearch(product.id, product.name);
                                }}
                                className="text-xs"
                              >
                                🔍 Research
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={stopPropagation}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-red-600">Error loading data</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && paginatedProducts.length === 0 && (
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
            {!isLoading && !error && paginatedProducts.length > 0 && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t gap-4">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} products
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
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
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
                    disabled={filters.page === pagination.totalPages}
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
                    disabled={filters.page === pagination.totalPages}
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
