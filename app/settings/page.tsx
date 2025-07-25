"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CategoryTree, { CategoryTreeNode, categoryTreeUtils } from "@/components/ui/category-tree";
import { 
  Settings, 
  ShoppingCart, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  TestTube,
  Server
} from "lucide-react";
import { CategoryApiResponse } from "@/lib/types";

export default function SettingsPage() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/woocommerce/categories');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      
             const response_data = await response.json();
       console.log('📦 [SETTINGS] Raw API response:', response_data);
       
       // Extract the actual data from the API wrapper
       const data: CategoryApiResponse = response_data.data;
       setCategories(data.categories || []);
       console.log(`Loaded ${data.totalCount || 0} categories with ${data.rootCount || 0} root categories`);
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      const response = await fetch('/api/woocommerce/categories');
      
             if (response.ok) {
         setConnectionStatus('success');
         // Auto-fetch categories on successful connection
         await fetchCategories();
       } else {
         setConnectionStatus('error');
         const errorData = await response.json().catch(() => ({}));
         setError(errorData.error || errorData.data?.error || 'Connection test failed');
       }
    } catch (error) {
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  const handleCategorySelect = (category: CategoryTreeNode) => {
    setSelectedCategories(prev => {
      if (prev.includes(category.id)) {
        return prev.filter(id => id !== category.id);
      } else {
        return [...prev, category.id];
      }
    });
  };

  // Auto-test connection on component mount
  useEffect(() => {
    testConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryStats = {
    total: categoryTreeUtils.flattenCategories(categories).length,
    roots: categories?.length || 0,
    leaves: categoryTreeUtils.getLeafCategories(categories).length,
    selected: selectedCategories.length
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your WooCommerce integration and categories
          </p>
        </div>

        <Tabs defaultValue="woocommerce" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="woocommerce" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              WooCommerce
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="woocommerce" className="space-y-6">
            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  WooCommerce Connection Status
                </CardTitle>
                <CardDescription>
                  Connection status for your WooCommerce store. Configure credentials in your .env.local file.
                </CardDescription>
              </CardHeader>
                             <CardContent className="space-y-4">
                 <div className="flex gap-2">
                  <Button 
                    onClick={testConnection} 
                    disabled={connectionStatus === 'testing'}
                    className="flex items-center gap-2"
                  >
                    {connectionStatus === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                </div>

                {/* Connection Status Display */}
                {connectionStatus !== 'idle' && (
                  <div className="pt-2">
                    {connectionStatus === 'success' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700">
                          ✅ Connection successful! WooCommerce API is working correctly.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {connectionStatus === 'error' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          ❌ Connection failed: {error}
                          <br />
                          <span className="text-xs mt-1 block">
                            Please check your environment variables in .env.local file.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories Management Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Category Management
                    </CardTitle>
                    <CardDescription>
                      View and manage your WooCommerce product categories
                    </CardDescription>
                  </div>
                  
                  <Button 
                    onClick={fetchCategories} 
                    disabled={isLoading || connectionStatus !== 'success'}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh Categories
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Connection Required Message */}
                {connectionStatus !== 'success' && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please establish a successful WooCommerce connection to view categories.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Category Stats */}
                {categories && categories.length > 0 && (
                  <div className="flex gap-4 mb-4">
                    <Badge variant="secondary">Total: {categoryStats.total}</Badge>
                    <Badge variant="secondary">Root: {categoryStats.roots}</Badge>
                    <Badge variant="secondary">Leaf: {categoryStats.leaves}</Badge>
                    {categoryStats.selected > 0 && (
                      <Badge variant="default">Selected: {categoryStats.selected}</Badge>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {error && connectionStatus === 'success' && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Categories Tree */}
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading categories...</span>
                    </div>
                  ) : connectionStatus === 'success' ? (
                    <CategoryTree
                      categories={categories}
                      onCategorySelect={handleCategorySelect}
                      selectedCategoryIds={selectedCategories}
                      showProductCount={true}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Connect to WooCommerce to view categories</p>
                    </div>
                  )}
                </div>

                {/* Selected Categories Info */}
                {selectedCategories && selectedCategories.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selected Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map(catId => {
                        const category = categoryTreeUtils.findCategoryById(categories, catId);
                        return category ? (
                          <Badge key={catId} variant="outline">
                            {category.name} ({category.count})
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  General application settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    General settings will be available in a future update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
