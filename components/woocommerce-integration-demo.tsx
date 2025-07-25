'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import WooCommercePreview from './woocommerce-preview'
import { RefreshCw, ShoppingCart } from 'lucide-react'

// Sample data structure based on their existing database schema
const sampleProductData = {
  // Basic product info from products table
  id: "534508a-4c2b-4f3d-9a0b-1234567890ab",
  name: "Kobalt #534509B Cordless Vacuum Kit 24V MAX Brushless",
  model: "#534509B",
  brand: "Kobalt",
  category: "Cordless Vacuum",
  description: "The Kobalt 24V MAX Brushless Cordless Stick Vacuum Kit offers powerful and versatile cleaning for various home environments. Featuring a high-performance brushless motor, HEPA filtration system, and a convertible design, it provides efficient debris collection and extended battery life for both floor and handheld cleaning tasks.",
  product_description: "Professional-grade cordless vacuum with advanced brushless motor technology",
  
  // Pricing data from market_research_data table  
  msrp: 299.99,
  competitive_price: 210.00,
  amazon_price: 245.99,
  ebay_price: 189.50,
  
  // Physical specs from products table
  weight_lbs: 4.2,
  width_inches: 10.5,
  height_inches: 44.0,
  depth_inches: 6.5,
  
  // SEO data from seo_analysis_data table
  seo_title: "Kobalt 24V MAX Brushless Cordless Vacuum Kit - Professional Cleaning Power",
  meta_description: "Shop the Kobalt 24V MAX Brushless Cordless Stick Vacuum Kit. Features powerful suction, HEPA filtration, and convertible design. Perfect for home and professional use.",
  url_slug: "kobalt-24v-max-brushless-cordless-vacuum-kit",
  keywords: [
    "cordless vacuum",
    "brushless motor",
    "HEPA filtration", 
    "24V battery",
    "stick vacuum",
    "convertible vacuum",
    "Kobalt tools"
  ],
  
  // Analysis data from product_analysis_data table
  item_condition: "good",
  condition_details: "Previously owned, well-maintained unit with all original accessories included",
  key_features: [
    "24V MAX brushless motor for extended motor life and strong suction",
    "Two-speed control (low/high) for versatile cleaning on various surfaces", 
    "Advanced HEPA filtration system traps fine dust and allergens",
    "Integrated LED light on the vacuum nozzle for improved visibility in dark areas",
    "Includes a 2.0 Ah 24V MAX lithium-ion battery and charger",
    "Delivers up to 30 minutes of continuous runtime on a single charge",
    "Provides 50 CFM (Cubic Feet Per Minute) of powerful airflow",
    "Features a 0.6-liter easy-empty dust bin",
    "Converts from stick vacuum to handheld vacuum for various cleaning tasks"
  ],
  technical_specs: {
    "AIRFLOW": "50 CFM",
    "RUNTIME": "Up to 30 minutes (with 2.0 Ah battery)",
    "MOTOR TYPE": "24V MAX Brushless",
    "BATTERY TYPE": "24V MAX Lithium-ion (2.0 Ah included)",
    "FILTER TYPE": "HEPA",
    "SPEED SETTINGS": "2 (Low/High)",
    "DUST BIN CAPACITY": "0.6 Liters",
    "INCLUDED ACCESSORIES": "2.0 Ah battery, charger, crevice tool, brush attachment, extension wand"
  },
  
  // Market data from market_research_data table
  market_demand: "high",
  competitor_count: 15,
  trending_score: 78,
  
  // Identifiers
  upc: "123456789012",
  item_number: "534509B",
  
  // Images from product_images table
  product_images: [
    {
      image_url: "https://example.com/kobalt-vacuum-main.jpg",
      is_primary: true
    },
    {
      image_url: "https://example.com/kobalt-vacuum-accessories.jpg", 
      is_primary: false
    },
    {
      image_url: "https://example.com/kobalt-vacuum-battery.jpg",
      is_primary: false
    }
  ]
}

export default function WooCommerceIntegrationDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [productData, setProductData] = useState(sampleProductData)

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call to fetch real data
    setTimeout(() => {
      setProductData({
        ...sampleProductData,
        // Simulate some random changes
        competitive_price: Math.round((Math.random() * 50 + 180) * 100) / 100,
        trending_score: Math.floor(Math.random() * 30 + 70)
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WooCommerce Integration Preview</h1>
          <p className="text-muted-foreground mt-2">
            Visualize how your pipeline data will be formatted for WooCommerce API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Publish to WooCommerce
          </Button>
        </div>
      </div>

      {/* Product Info Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product: {productData.name}</span>
            <div className="flex gap-2">
              <Badge variant="secondary">Phase 4 Complete</Badge>
              <Badge variant={productData.market_demand === 'high' ? 'default' : 'secondary'}>
                {productData.market_demand?.toUpperCase()} Demand
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">Brand</label>
              <p>{productData.brand}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Category</label>
              <p>{productData.category}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Model</label>
              <p>{productData.model}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Condition</label>
              <p className="capitalize">{productData.item_condition?.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WooCommerce Preview Component */}
      <WooCommercePreview productData={productData} />

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">1. Configure WooCommerce</h3>
              <p className="text-sm text-muted-foreground">
                Set up WooCommerce REST API credentials and configure your store settings.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">2. Map Your Data</h3>
              <p className="text-sm text-muted-foreground">
                Use the preview above to verify how your pipeline data maps to WooCommerce fields.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">3. Publish Products</h3>
              <p className="text-sm text-muted-foreground">
                Send the generated payload to WooCommerce API to create optimized product listings.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Data Sources Used:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>products</strong> table: Basic info, descriptions, SEO data, physical specs</p>
              <p>• <strong>market_research_data</strong> table: Pricing, competitor analysis, market demand</p>
              <p>• <strong>seo_analysis_data</strong> table: Optimized titles, meta descriptions, keywords</p>
              <p>• <strong>product_analysis_data</strong> table: Condition assessment, feature analysis</p>
              <p>• <strong>product_images</strong> table: Product photos and media assets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 