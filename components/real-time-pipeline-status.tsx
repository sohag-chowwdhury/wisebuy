"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Database,
  Search,
  Upload,
  Zap,
  Play,
  SkipForward,
  RotateCcw,
  Settings
} from "lucide-react";
import { useProducts } from "@/lib/supabase/hooks";
import { toast } from "sonner";

const PHASE_CONFIG = {
  1: {
    name: "Product Analysis",
    description: "AI identification and condition assessment",
    icon: Eye,
    color: "text-blue-500",
  },
  2: {
    name: "Market Research", 
    description: "Pricing analysis and specifications",
    icon: Database,
    color: "text-green-500",
  },
  3: {
    name: "SEO Analysis",
    description: "Content optimization and keywords",
    icon: Search,
    color: "text-purple-500",
  },
  4: {
    name: "Product Listing",
    description: "Multi-platform publishing",
    icon: Upload,
    color: "text-orange-500",
  },
};

interface ProcessingProduct {
  id: string;
  name: string;
  model: string;
  status: string;
  currentPhase: number;
  progress: number;
  lastUpdated: string;
  aiConfidence?: number;
}

export function RealTimePipelineStatus() {
  const { products, loading, error } = useProducts();
  const [processingProducts, setProcessingProducts] = useState<ProcessingProduct[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual pipeline control functions
  const advanceProduct = async (productId: string, action: string, phase?: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, phase })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to advance product');
      }
    } catch (error) {
      toast.error('Error advancing product pipeline');
      console.error('Error:', error);
    }
  };

  // Remove excessive polling - rely on real-time subscriptions instead

  useEffect(() => {
    if (products) {
      // Filter products that are currently processing
      const processing = products
        .filter(p => {
          // Only show products that are actively processing, exclude completed, error, paused, etc.
          const processingStatuses = ['processing', 'uploaded', 'phase_1', 'phase_2', 'phase_3', 'phase_4'];
          const isProcessing = processingStatuses.includes(p.status) 
                              && !['completed', 'error', 'cancelled', 'published'].includes(p.status);
          return isProcessing;
        })
        .map(p => {
          // Calculate progress from phases if available
          let calculatedProgress = 0;
          let currentPhase = p.current_phase || 1;
          
          if (p.phases && p.phases.length > 0) {
            const completedPhases = p.phases.filter(phase => phase.status === 'completed').length;
            const runningPhases = p.phases.filter(phase => phase.status === 'running').length;
            calculatedProgress = (completedPhases / 4) * 100;
            if (runningPhases > 0) {
              calculatedProgress += (runningPhases / 4) * 50; // Add 50% for running phases
            }
            
            // Get current phase from phases data
            const runningPhase = p.phases.find(phase => phase.status === 'running');
            const latestCompletedPhase = p.phases
              .filter(phase => phase.status === 'completed')
              .sort((a, b) => b.phase_number - a.phase_number)[0];
            
            if (runningPhase) {
              currentPhase = runningPhase.phase_number;
            } else if (latestCompletedPhase) {
              currentPhase = latestCompletedPhase.phase_number + 1;
            }
            
            console.log(`📊 [RealTimePipelineStatus] Product ${p.id}: phases=${p.phases.length}, completed=${completedPhases}, running=${runningPhases}, progress=${calculatedProgress}%`);
          } else {
            // Fallback to basic progress calculation
            calculatedProgress = p.progress || 0;
          }
          
          return {
            id: p.id,
            name: p.name || 'Unknown Product',
            model: p.model || 'Unknown Model',
            status: p.status,
            currentPhase: Math.min(currentPhase, 4),
            progress: Math.min(Math.round(calculatedProgress), 100),
            lastUpdated: p.updated_at || p.updatedAt,
            aiConfidence: p.ai_confidence || p.aiConfidence || undefined,
          };
        })
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

      setProcessingProducts(processing);
      
      if (processing.length > 0) {
        setLastUpdateTime(new Date().toLocaleTimeString());
      }
      
      // Show toast for phase completions
      const completedProducts = products.filter(p => p.status === 'completed');
      if (completedProducts.length > 0) {
        const latestCompleted = completedProducts.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        
        const timeSinceUpdate = Date.now() - new Date(latestCompleted.updated_at).getTime();
        if (timeSinceUpdate < 5000) { // Show toast if completed within last 5 seconds
          toast.success(`${latestCompleted.name} processing completed!`);
        }
      }
    }
  }, [products]);

  const getPhaseProgress = (currentPhase: number, progress: number) => {
    // Progress is now already calculated properly in the useEffect
    // Just return the progress as-is with bounds checking
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading Pipeline Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Pipeline Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Live Pipeline Status
            {processingProducts.length > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {processingProducts.length} Processing
              </Badge>
            )}
          </CardTitle>
          {lastUpdateTime && (
            <span className="text-xs text-muted-foreground">
              Last update: {lastUpdateTime}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {processingProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">All pipelines idle</p>
            <p className="text-xs text-muted-foreground">
              No products are currently being processed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {processingProducts.map((product) => {
              const phaseConfig = PHASE_CONFIG[product.currentPhase as keyof typeof PHASE_CONFIG];
              const Icon = phaseConfig?.icon || Activity;
              const overallProgress = getPhaseProgress(product.currentPhase, product.progress);
              
              return (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <Badge
                          variant="outline"
                          className="text-xs animate-pulse border-green-500 text-green-600"
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{product.model}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/dashboard/pipeline/${product.id}`, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${phaseConfig?.color}`} />
                        <span className="font-medium">{phaseConfig?.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Phase {product.currentPhase}/4
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        {Math.round(overallProgress)}%
                      </span>
                    </div>
                    
                    <Progress value={overallProgress} className="h-2" />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{phaseConfig?.description}</span>
                      <span>{formatTimeAgo(product.lastUpdated)}</span>
                    </div>
                    
                    {product.aiConfidence && product.aiConfidence > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">AI Confidence:</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(product.aiConfidence)}%
                        </Badge>
                      </div>
                    )}

                    {/* Manual Pipeline Controls */}
                    <div className="flex items-center gap-1 pt-2 border-t">
                      <span className="text-xs text-muted-foreground mr-2">Manual Controls:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => advanceProduct(product.id, 'advance_to_next')}
                        disabled={product.currentPhase >= 4}
                      >
                        <SkipForward className="h-3 w-3 mr-1" />
                        Advance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          fetch(`/api/products/${product.id}/simulate-progress`, { method: 'POST' })
                            .then(r => r.json())
                            .then(result => {
                              if (result.success) {
                                toast.success('Started progressive simulation - watch for real-time updates!');
                              } else {
                                toast.error(result.error || 'Failed to start simulation');
                              }
                            })
                            .catch(err => {
                              toast.error('Error starting simulation');
                              console.error(err);
                            });
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Simulate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          fetch(`/api/products/${product.id}/complete-stuck-phases`, { method: 'POST' })
                            .then(r => r.json())
                            .then(result => {
                              if (result.success) {
                                toast.success(`Fixed ${result.completedPhases} stuck phases!`);
                              } else {
                                toast.error(result.error || 'Failed to fix phases');
                              }
                            })
                            .catch(err => {
                              toast.error('Error fixing stuck phases');
                              console.error(err);
                            });
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Fix
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => advanceProduct(product.id, 'reset')}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 