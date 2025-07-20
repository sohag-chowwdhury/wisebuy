# 🗄️ Database Setup & Implementation Guide

## Overview

This database schema supports a **multi-phase pipeline system** with **real-time updates** for your product processing workflow. It's designed for warehouse managers to upload product images and run parallel AI/ML pipelines in the background.

## 🚀 Quick Setup

### 1. Create Tables in Supabase

```sql
-- Run the entire database-schema.sql file in your Supabase SQL Editor
-- This will create all tables, indexes, policies, and functions
```

### 2. Enable Real-time Features

In your Supabase dashboard:

1. Go to **Database > Replication**
2. Enable real-time for these tables:
   - `products`
   - `pipeline_phases`
   - `pipeline_logs`

### 3. Configure Storage

```sql
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create storage policy
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📋 User Flow Implementation

### 1. Product Upload Flow

```typescript
// 1. User uploads product images
const uploadProduct = async (
  images: File[],
  productName?: string,
  model?: string
) => {
  // Create product record
  const { data: product } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: productName,
      model: model,
      status: "uploaded",
    })
    .select()
    .single();

  // Upload images to storage
  const imageUploads = await Promise.all(
    images.map(async (file, index) => {
      const fileName = `${product.id}/${Date.now()}-${file.name}`;
      const { data } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      // Save image record
      return supabase.from("product_images").insert({
        product_id: product.id,
        image_url: data?.path,
        storage_path: fileName,
        is_primary: index === 0,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    })
  );

  // Start Phase 1 automatically
  await supabase.rpc("start_phase", {
    p_product_id: product.id,
    p_phase_number: 1,
  });

  return product;
};
```

### 2. Phase Management

```typescript
// Start a phase
const startPhase = async (productId: string, phaseNumber: number) => {
  const { data } = await supabase.rpc("start_phase", {
    p_product_id: productId,
    p_phase_number: phaseNumber,
  });
  return data;
};

// Complete a phase (called by backend AI services)
const completePhase = async (productId: string, phaseNumber: number) => {
  await supabase.rpc("complete_phase", {
    p_product_id: productId,
    p_phase_number: phaseNumber,
  });
};

// Stop a phase
const stopPhase = async (productId: string, phaseNumber: number) => {
  await supabase
    .from("pipeline_phases")
    .update({
      status: "stopped",
      stopped_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("phase_number", phaseNumber);
};
```

### 3. Real-time Subscriptions

```typescript
// Subscribe to pipeline updates
const subscribeToProduct = (
  productId: string,
  callback: (update: any) => void
) => {
  return supabase
    .channel(`product-${productId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pipeline_phases",
        filter: `product_id=eq.${productId}`,
      },
      callback
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
        filter: `id=eq.${productId}`,
      },
      callback
    )
    .subscribe();
};

// Subscribe to all user's pipeline updates
const subscribeToUserPipelines = (
  userId: string,
  callback: (update: any) => void
) => {
  return supabase
    .channel("user-pipelines")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
```

## 🤖 Backend AI/ML Integration

### 1. Phase 1 - Product Analysis

```typescript
// AI service processes uploaded images
const processPhase1 = async (productId: string) => {
  try {
    // Update phase status to running
    await supabase
      .from("pipeline_phases")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("product_id", productId)
      .eq("phase_number", 1);

    // Get product images
    const { data: images } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId);

    // Run AI analysis (your ML logic here)
    const analysisResult = await aiAnalyzeProduct(images);

    // Save results
    await supabase.from("product_analysis_data").insert({
      product_id: productId,
      product_name: analysisResult.name,
      model: analysisResult.model,
      confidence: analysisResult.confidence,
      item_condition: analysisResult.condition,
      condition_details: analysisResult.details,
      detected_categories: analysisResult.categories,
      detected_brands: analysisResult.brands,
      image_quality_score: analysisResult.imageQuality,
    });

    // Update product AI confidence
    await supabase
      .from("products")
      .update({ ai_confidence: analysisResult.confidence })
      .eq("id", productId);

    // Complete phase or mark for manual review
    if (analysisResult.confidence >= 80) {
      await supabase.rpc("complete_phase", {
        p_product_id: productId,
        p_phase_number: 1,
      });
    } else {
      await supabase
        .from("products")
        .update({
          status: "error",
          requires_manual_review: true,
          error_message: "Low AI confidence - manual review required",
        })
        .eq("id", productId);
    }
  } catch (error) {
    // Handle errors
    await supabase
      .from("pipeline_phases")
      .update({
        status: "failed",
        error_message: error.message,
      })
      .eq("product_id", productId)
      .eq("phase_number", 1);
  }
};
```

### 2. Phase 2 - Market Research

```typescript
const processPhase2 = async (productId: string) => {
  // Get Phase 1 data
  const { data: phase1 } = await supabase
    .from("product_analysis_data")
    .select("*")
    .eq("product_id", productId)
    .single();

  // Run market research (your API calls here)
  const marketData = await fetchMarketData(phase1.product_name, phase1.model);

  // Save results
  await supabase.from("market_research_data").insert({
    product_id: productId,
    amazon_price: marketData.amazonPrice,
    amazon_link: marketData.amazonLink,
    msrp: marketData.msrp,
    competitive_price: marketData.competitivePrice,
    brand: marketData.brand,
    category: marketData.category,
    // ... other fields
  });

  await supabase.rpc("complete_phase", {
    p_product_id: productId,
    p_phase_number: 2,
  });
};
```

## 📊 Dashboard Queries

### Get User's Products with Status

```typescript
const getUserProducts = async (userId: string) => {
  const { data } = await supabase
    .from("products")
    .select(
      `
      *,
      phases:pipeline_phases(*),
      images:product_images(*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data;
};
```

### Get Product with All Phase Data

```typescript
const getProductDetails = async (productId: string) => {
  const { data } = await supabase
    .from("products")
    .select(
      `
      *,
      phases:pipeline_phases(*),
      images:product_images(*),
      product_analysis_data(*),
      market_research_data(*),
      seo_analysis_data(*),
      product_listing_data(*)
    `
    )
    .eq("id", productId)
    .single();

  return data;
};
```

### Dashboard Summary

```typescript
const getDashboardSummary = async (userId: string) => {
  const [products, activeCount, completedCount, errorCount] = await Promise.all(
    [
      supabase.from("products").select("id, status").eq("user_id", userId),

      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_pipeline_running", true),

      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("status", "completed"),

      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("status", "error"),
    ]
  );

  return {
    total_products: products.data?.length || 0,
    active_pipelines: activeCount.count || 0,
    completed_products: completedCount.count || 0,
    error_products: errorCount.count || 0,
  };
};
```

## 🔧 Error Handling & Recovery

### Manual Review Flow

```typescript
// When AI confidence is low, user provides manual input
const resumeFromManualReview = async (
  productId: string,
  userInput: {
    productName: string;
    model: string;
    condition: string;
  }
) => {
  // Update Phase 1 data with user input
  await supabase
    .from("product_analysis_data")
    .update({
      product_name: userInput.productName,
      model: userInput.model,
      item_condition: userInput.condition,
      confidence: 100, // User confirmed
    })
    .eq("product_id", productId);

  // Update product status
  await supabase
    .from("products")
    .update({
      status: "processing",
      requires_manual_review: false,
      ai_confidence: 100,
    })
    .eq("id", productId);

  // Complete Phase 1 and continue
  await supabase.rpc("complete_phase", {
    p_product_id: productId,
    p_phase_number: 1,
  });
};
```

### Retry Failed Phases

```typescript
const retryPhase = async (productId: string, phaseNumber: number) => {
  await supabase
    .from("pipeline_phases")
    .update({
      status: "pending",
      error_message: null,
      retry_count: supabase.raw("retry_count + 1"),
    })
    .eq("product_id", productId)
    .eq("phase_number", phaseNumber);

  // Restart the phase
  await startPhase(productId, phaseNumber);
};
```

## 🔔 Logging & Monitoring

```typescript
// Add pipeline logs
const logPipelineEvent = async (
  productId: string,
  phaseNumber: number,
  level: string,
  message: string,
  details?: any
) => {
  await supabase.from("pipeline_logs").insert({
    product_id: productId,
    phase_number: phaseNumber,
    log_level: level,
    message: message,
    details: details || {},
    action: "phase_update",
  });
};
```

## 🎯 Key Benefits

✅ **Parallel Processing**: Multiple products can run through pipeline simultaneously  
✅ **Real-time Updates**: Instant status updates without polling  
✅ **Error Recovery**: Robust error handling and retry mechanisms  
✅ **Manual Review**: AI confidence-based manual intervention  
✅ **Comprehensive Logging**: Full audit trail of all pipeline activities  
✅ **Type Safety**: Complete TypeScript interfaces for all data structures  
✅ **Scalable**: Optimized with proper indexes and RLS policies

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authenticated Storage**: Images are stored securely per user
- **Input Validation**: Database constraints prevent invalid data
- **Audit Trail**: Complete logging of all user and system actions

This schema is production-ready and designed to handle your warehouse management workflow with real-time capabilities and robust error handling!
