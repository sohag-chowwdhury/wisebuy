'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  ShoppingCart, 
  Search, 
  DollarSign, 
  Package, 
  Tag, 
  Globe,
  Copy,
  Check 
} from 'lucide-react'

interface WooCommercePreviewProps {
  productData: {
    // Basic product info
    id: string
    name: string
    model?: string
    brand?: string
    category?: string
    description?: string
    product_description?: string
    
    // Pricing data
    msrp?: number
    competitive_price?: number
    amazon_price?: number
    ebay_price?: number
    
    // Physical specs
    weight_lbs?: number
    width_inches?: number
    height_inches?: number
    depth_inches?: number
    
    // SEO data
    seo_title?: string
    meta_description?: string
    url_slug?: string
    keywords?: string[]
    
    // Analysis data
    item_condition?: string
    condition_details?: string
    key_features?: string[]
    technical_specs?: Record<string, any>
    
    // Market data
    market_demand?: string
    competitor_count?: number
    trending_score?: number
    
    // Identifiers
    upc?: string
    item_number?: string
    
    // Images
    product_images?: Array<{
      image_url: string
      is_primary: boolean
    }>
  }
}

export default function WooCommercePreview({ productData }: WooCommercePreviewProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  
  // Add state for editable dimensions
  const [editableDimensions, setEditableDimensions] = useState({
    width: productData.width_inches || 0,
    height: productData.height_inches || 0,
    length: productData.depth_inches || 0,
    weight: productData.weight_lbs || 0
  })

  // Update dimensions when productData changes
  React.useEffect(() => {
    setEditableDimensions({
      width: productData.width_inches || 0,
      height: productData.height_inches || 0,
      length: productData.depth_inches || 0,
      weight: productData.weight_lbs || 0
    })
  }, [productData.width_inches, productData.height_inches, productData.depth_inches, productData.weight_lbs])

  // Update dimension handler
  const handleDimensionChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setEditableDimensions(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  // Generate WooCommerce payload (updated to use editable dimensions)
  const generateWooCommercePayload = () => {
    return {
      name: productData.seo_title || productData.name,
      slug: productData.url_slug || productData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: "simple",
      status: "publish",
      featured: productData.market_demand === 'high',
      catalog_visibility: "visible",
      
      // Pricing
      regular_price: productData.msrp?.toString() || "",
      sale_price: productData.competitive_price?.toString() || "",
      
      // Content
      description: buildProductDescription(),
      short_description: productData.meta_description || `${productData.name} - ${productData.condition_details || 'Quality product'}`,
      
      // Inventory
      sku: productData.item_number || `PROD-${productData.id.slice(0, 8)}`,
      manage_stock: true,
      stock_quantity: 1,
      stock_status: productData.item_condition === 'excellent' ? 'instock' : 'outofstock',
      
      // Physical attributes (using editable values)
      weight: editableDimensions.weight.toString(),
      dimensions: {
        length: editableDimensions.length.toString(),
        width: editableDimensions.width.toString(),
        height: editableDimensions.height.toString()
      },
      
      // Images
      images: productData.product_images?.map((img, index) => ({
        src: img.image_url,
        alt: `${productData.name} - View ${index + 1}`,
        position: index
      })) || [],
      
      // Categories and Tags
      categories: [
        { name: productData.category || 'Uncategorized' }
      ],
      tags: productData.keywords?.map(keyword => ({ name: keyword })) || [],
      
      // SEO Meta Data
      meta_data: [
        {
          key: "_yoast_wpseo_title",
          value: productData.seo_title || productData.name
        },
        {
          key: "_yoast_wpseo_metadesc",
          value: productData.meta_description
        },
        {
          key: "_yoast_wpseo_focuskw", 
          value: productData.keywords?.[0] || ""
        },
        {
          key: "_product_gtin",
          value: productData.upc || ""
        },
        {
          key: "_product_mpn",
          value: productData.item_number || ""
        },
        {
          key: "_amazon_reference_price",
          value: productData.amazon_price?.toString() || ""
        },
        {
          key: "_ebay_reference_price", 
          value: productData.ebay_price?.toString() || ""
        },
        {
          key: "_market_analysis",
          value: JSON.stringify({
            demand: productData.market_demand,
            competitors: productData.competitor_count,
            trending_score: productData.trending_score
          })
        },
        {
          key: "_product_condition",
          value: productData.item_condition
        },
        {
          key: "_condition_details",
          value: productData.condition_details
        }
      ].filter(meta => meta.value)
    }
  }

  const buildProductDescription = () => {
    let description = `<h2>${productData.name}</h2>`
    
    if (productData.item_condition) {
      description += `<p><strong>Condition:</strong> ${productData.item_condition.replace('_', ' ').toUpperCase()}</p>`
    }
    
    if (productData.condition_details) {
      description += `<p>${productData.condition_details}</p>`
    }
    
    if (productData.description || productData.product_description) {
      description += `<p>${productData.description || productData.product_description}</p>`
    }
    
    if (productData.key_features?.length) {
      description += `<h3>Key Features:</h3><ul>`
      productData.key_features.forEach(feature => {
        description += `<li>${feature}</li>`
      })
      description += `</ul>`
    }
    
    if (productData.technical_specs && Object.keys(productData.technical_specs).length > 0) {
      description += `<h3>Technical Specifications:</h3><ul>`
      Object.entries(productData.technical_specs).forEach(([key, value]) => {
        description += `<li><strong>${key}:</strong> ${value}</li>`
      })
      description += `</ul>`
    }
    
    return description
  }

  const wooPayload = generateWooCommercePayload()

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatPrice = (price?: number) => {
    return price ? `$${price.toFixed(2)}` : 'Not set'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WooCommerce API Preview</h2>
          <p className="text-muted-foreground">
            Preview how your product data will be formatted for WooCommerce
          </p>
        </div>
        <Badge variant={productData.market_demand === 'high' ? 'default' : 'secondary'}>
          {productData.market_demand?.toUpperCase() || 'UNKNOWN'} Demand
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO Data</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="payload">API Payload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Product Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WooCommerce Title</label>
                  <p className="font-medium">{wooPayload.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL Slug</label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">{wooPayload.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="font-mono text-sm">{wooPayload.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Badge variant="outline">{wooPayload.categories[0]?.name}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                  <Badge variant={wooPayload.stock_status === 'instock' ? 'default' : 'destructive'}>
                    {wooPayload.stock_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Physical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Physical Specs
                  <Badge variant="secondary" className="text-xs">Editable</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Edit values below to update the WooCommerce payload in real-time
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="weight" className="text-sm font-medium text-muted-foreground">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={editableDimensions.weight}
                    onChange={(e) => handleDimensionChange('weight', e.target.value)}
                    className="w-full"
                    placeholder="Enter weight in pounds"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-sm font-medium text-muted-foreground">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={editableDimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    className="w-full"
                    placeholder="Enter width in inches"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-sm font-medium text-muted-foreground">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={editableDimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    className="w-full"
                    placeholder="Enter height in inches"
                  />
                </div>
                <div>
                  <Label htmlFor="length" className="text-sm font-medium text-muted-foreground">Length (inches)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    value={editableDimensions.length}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    className="w-full"
                    placeholder="Enter length in inches"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <Badge variant="outline">
                    {productData.item_condition?.replace('_', ' ').toUpperCase() || 'Not specified'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Images</label>
                  <p>{wooPayload.images?.length || 0} images ready</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Description Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Product Description (HTML)</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none bg-muted p-4 rounded-lg"
                dangerouslySetInnerHTML={{ __html: wooPayload.description }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SEO Title</label>
                  <p className="font-medium">{wooPayload.meta_data.find(m => m.key === '_yoast_wpseo_title')?.value}</p>
                  <p className="text-xs text-muted-foreground">
                    Length: {(wooPayload.meta_data.find(m => m.key === '_yoast_wpseo_title')?.value as string)?.length || 0} chars
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                  <p className="text-sm">{wooPayload.meta_data.find(m => m.key === '_yoast_wpseo_metadesc')?.value}</p>
                  <p className="text-xs text-muted-foreground">
                    Length: {(wooPayload.meta_data.find(m => m.key === '_yoast_wpseo_metadesc')?.value as string)?.length || 0} chars
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Focus Keyword</label>
                  <Badge variant="secondary">
                    {wooPayload.meta_data.find(m => m.key === '_yoast_wpseo_focuskw')?.value || 'Not set'}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags ({wooPayload.tags?.length || 0})</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {wooPayload.tags?.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {(wooPayload.tags?.length || 0) > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(wooPayload.tags?.length || 0) - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Product Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">GTIN/UPC</label>
                  <p className="font-mono text-sm">
                    {wooPayload.meta_data.find(m => m.key === '_product_gtin')?.value || 'Not available'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Manufacturer Part Number</label>
                  <p className="font-mono text-sm">
                    {wooPayload.meta_data.find(m => m.key === '_product_mpn')?.value || 'Not available'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Market Analysis</label>
                  <div className="bg-muted p-3 rounded text-xs">
                    <pre>{JSON.stringify(JSON.parse(wooPayload.meta_data.find(m => m.key === '_market_analysis')?.value as string || '{}'), null, 2)}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  WooCommerce Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Regular Price (MSRP)</label>
                  <p className="text-2xl font-bold">{formatPrice(Number(wooPayload.regular_price))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sale Price (Competitive)</label>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(Number(wooPayload.sale_price))}</p>
                </div>
                {Number(wooPayload.regular_price) > 0 && Number(wooPayload.sale_price) > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Savings</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatPrice(Number(wooPayload.regular_price) - Number(wooPayload.sale_price))} 
                      ({Math.round(((Number(wooPayload.regular_price) - Number(wooPayload.sale_price)) / Number(wooPayload.regular_price)) * 100)}% off)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Reference Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amazon Price</label>
                  <p className="font-semibold">{formatPrice(productData.amazon_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">eBay Price</label>
                  <p className="font-semibold">{formatPrice(productData.ebay_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Market Position</label>
                  <Badge variant={
                    Number(wooPayload.sale_price) < (productData.amazon_price || 0) ? 'default' :
                    Number(wooPayload.sale_price) === (productData.amazon_price || 0) ? 'secondary' : 'destructive'
                  }>
                    {Number(wooPayload.sale_price) < (productData.amazon_price || 0) ? 'COMPETITIVE' :
                     Number(wooPayload.sale_price) === (productData.amazon_price || 0) ? 'MATCHED' : 'ABOVE MARKET'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Market Demand</label>
                  <Badge variant={
                    productData.market_demand === 'high' ? 'default' :
                    productData.market_demand === 'medium' ? 'secondary' : 'outline'
                  }>
                    {productData.market_demand?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Competitors</label>
                  <p className="font-semibold">{productData.competitor_count || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trending Score</label>
                  <p className="font-semibold">{productData.trending_score || 0}/100</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Complete WooCommerce API Payload</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(wooPayload, null, 2), 'payload')}
                >
                  {copiedSection === 'payload' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedSection === 'payload' ? 'Copied!' : 'Copy JSON'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(wooPayload, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Method</label>
                    <Badge variant="default" className="ml-2">POST</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                    <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                      /wp-json/wc/v3/products
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Content-Type</label>
                    <p className="text-sm">application/json</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payload Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total fields:</span>
                    <span className="font-semibold">{Object.keys(wooPayload).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meta data entries:</span>
                    <span className="font-semibold">{wooPayload.meta_data.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span className="font-semibold">{wooPayload.images?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tags:</span>
                    <span className="font-semibold">{wooPayload.tags?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span className="font-semibold">{wooPayload.categories?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 