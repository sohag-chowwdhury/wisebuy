# WooCommerce Integration Guide

## Overview

This guide shows how your existing product pipeline data maps to WooCommerce API format for seamless e-commerce integration.

## Components Created

### 1. `WooCommercePreview` Component
**File:** `components/woocommerce-preview.tsx`

A comprehensive preview component that shows how your data will be formatted for WooCommerce API:

- **Overview Tab**: Basic product information and physical specifications
- **SEO Tab**: SEO optimization data and product identifiers  
- **Pricing Tab**: Competitive pricing analysis and market intelligence
- **API Payload Tab**: Complete JSON payload ready for WooCommerce API

### 2. `WooCommerceIntegrationDemo` Component  
**File:** `components/woocommerce-integration-demo.tsx`

A demo page showcasing the integration with sample data from your Kobalt vacuum example.

### 3. Demo Page
**File:** `app/woocommerce-preview/page.tsx`

Access the demo at: `http://localhost:3000/woocommerce-preview`

## Data Mapping

Your pipeline data maps to WooCommerce as follows:

### Basic Product Information
```javascript
// From your 'products' table
{
  name: products.seo_title || products.name,
  slug: products.url_slug,
  description: products.description,
  short_description: products.meta_description,
  sku: products.item_number,
  weight: products.weight_lbs,
  dimensions: {
    length: products.depth_inches,
    width: products.width_inches,
    height: products.height_inches
  }
}
```

### Pricing Data
```javascript
// From your 'market_research_data' table
{
  regular_price: market_research_data.msrp,
  sale_price: market_research_data.competitive_price,
  // Reference prices stored in meta_data
  meta_data: [
    { key: "_amazon_reference_price", value: amazon_price },
    { key: "_ebay_reference_price", value: ebay_price }
  ]
}
```

### SEO Optimization
```javascript
// From your 'seo_analysis_data' table
{
  meta_data: [
    { key: "_yoast_wpseo_title", value: seo_analysis_data.seo_title },
    { key: "_yoast_wpseo_metadesc", value: seo_analysis_data.meta_description },
    { key: "_yoast_wpseo_focuskw", value: seo_analysis_data.keywords[0] }
  ],
  tags: seo_analysis_data.tags.map(tag => ({ name: tag }))
}
```

### Product Identification
```javascript
// Product identifiers and compliance
{
  meta_data: [
    { key: "_product_gtin", value: products.upc },
    { key: "_product_mpn", value: products.item_number },
    { key: "_market_analysis", value: JSON.stringify(market_data) }
  ]
}
```

## Key Features

### ✅ Complete Data Mapping
- Maps all your pipeline phases to WooCommerce fields
- Preserves SEO optimization from Phase 4
- Includes competitive pricing from Phase 2
- Maintains product analysis from Phase 1

### ✅ SEO-Optimized Output
- Yoast SEO compatible meta fields
- Structured product descriptions with HTML
- Keyword-optimized titles and slugs
- Schema markup support

### ✅ Competitive Intelligence
- Reference pricing from Amazon/eBay
- Market demand indicators
- Competitor analysis data
- Price positioning badges

### ✅ Real-time Preview
- Visual JSON payload preview
- Copy-to-clipboard functionality
- Tabbed interface for easy navigation
- Responsive design

## Usage Examples

### Basic Usage
```tsx
import WooCommercePreview from '@/components/woocommerce-preview'

// Fetch your product data from database
const productData = await getProductWithAllData(productId)

return <WooCommercePreview productData={productData} />
```

### Integration with Existing Pipeline
```tsx
// In your product listing component
import { useState } from 'react'
import WooCommercePreview from '@/components/woocommerce-preview'

export default function ProductListing({ product }) {
  const [showWooPreview, setShowWooPreview] = useState(false)
  
  return (
    <div>
      {/* Your existing product UI */}
      <Button onClick={() => setShowWooPreview(true)}>
        Preview WooCommerce
      </Button>
      
      {showWooPreview && (
        <WooCommercePreview productData={product} />
      )}
    </div>
  )
}
```

## API Integration

### WooCommerce REST API Endpoint
```
POST /wp-json/wc/v3/products
Content-Type: application/json
Authorization: Basic [base64(consumer_key:consumer_secret)]
```

### Sample Implementation
```javascript
async function publishToWooCommerce(productData) {
  const wooPayload = generateWooCommercePayload(productData)
  
  const response = await fetch('https://yourstore.com/wp-json/wc/v3/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`
    },
    body: JSON.stringify(wooPayload)
  })
  
  return response.json()
}
```

## Database Tables Used

Your integration leverages data from these tables:

- **`products`**: Basic info, SEO data, physical specs
- **`market_research_data`**: Pricing, competitor analysis  
- **`seo_analysis_data`**: Optimized titles, meta descriptions
- **`product_analysis_data`**: Condition assessment, features
- **`product_images`**: Product photos and media

## Next Steps

1. **Configure WooCommerce**: Set up REST API credentials
2. **Test Integration**: Use the preview to verify data mapping
3. **Implement Publishing**: Create API endpoint to publish products
4. **Monitor Results**: Track listing performance and optimize

## Benefits

- **Automated SEO**: Your Phase 4 SEO analysis becomes WooCommerce meta data
- **Competitive Pricing**: Market research translates to optimized pricing
- **Rich Content**: Product features become detailed descriptions
- **Professional Quality**: All your pipeline intelligence enhances listings
- **Time Savings**: No manual data entry or listing creation

Visit `/woocommerce-preview` to see the integration in action! 