import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import {
  ProductAnalysis,
  MSRPData,
  ProductSpecifications,
  CompetitiveData,
  PricingSuggestion,
  SEOData,
  PricingRequest,
  SEORequest,
} from "./types";
import { APIError, parseJSONFromText, retryWithBackoff } from "./api-utils";
import { cleanDirtyJsonStr } from "./utils";

// Helper function to detect image format from buffer
function detectImageMediaType(buffer: Buffer): string {
  // Check file signatures (magic numbers)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.subarray(8, 12).toString() === "WEBP") {
    return "image/webp";
  }

  // Fallback to JPEG if format is not detected
  console.warn("⚠️ Could not detect image format, defaulting to JPEG");
  return "image/jpeg";
}

const geminiModel = "gemini-2.5-flash";

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Abstract AI Service interface
export interface AIService {
  analyzeImages(imageBuffers: Buffer[]): Promise<ProductAnalysis>;
  generateSEOContent(request: SEORequest): Promise<SEOData>;
}

// Gemini Service for web search capabilities
export interface SearchService {
  getMSRPData(productModel: string): Promise<MSRPData>;
  getSpecifications(productModel: string): Promise<ProductSpecifications>;
  getCompetitiveAnalysis(productModel: string): Promise<CompetitiveData>;
}

// Claude Service Implementation
export class ClaudeService implements AIService {
  private readonly VISION_SYSTEM_PROMPT = `You are a product analysis expert. Your task is to analyze product images and provide detailed information about them.

For each set of images:
1. Identify the product model and brand
2. Assess the condition of the product
3. List any visible defects or wear
4. Provide a confidence score (1-100) for your identification. If it is not clear, set it to 0. If it is not a product, set it to 0.

Please Return ONLY valid JSON without any explanatory text, comments, markdown formatting, or additional information, it should be valid parsable JSON with no other text, because it will be directly fed into a json parser.

Return your analysis in JSON format with this structure:
{
  "model": string,
  "confidence": number (1-100),
  "condition": string,
  "defects": string[]
}

Be thorough and precise in your analysis. If you're unsure about any aspect, indicate this in your response.`;

  private readonly SEO_SYSTEM_PROMPT = `You are an expert SEO copywriter specializing in e-commerce product listings. Your task is to create SEO-optimized content for used product listings that will rank well on search engines and convert browsers into buyers.

Key requirements:
1. Focus on long-tail keywords that buyers actually search for
2. Include condition-specific keywords (used, refurbished, pre-owned, etc.)
3. Highlight value propositions (savings vs new, quality, authenticity)
4. Create compelling, conversion-focused copy
5. Follow e-commerce SEO best practices
6. Include relevant technical specifications naturally
7. Generate proper schema markup for rich snippets

Return ONLY valid JSON without any explanatory text, comments, or markdown formatting.`;

  async analyzeImages(imageBuffers: Buffer[]): Promise<ProductAnalysis> {
    return retryWithBackoff(async () => {
      try {
        console.log(`📸 [CLAUDE] Analyzing ${imageBuffers.length} images...`);

        const content: ContentBlockParam[] = [];
        imageBuffers.forEach((buffer, index) => {
          const mediaType = detectImageMediaType(buffer);
          console.log(
            `🔍 [CLAUDE] Detected image ${index + 1} format: ${mediaType}`
          );

          content.push(
            {
              type: "text",
              text: `Image ${index + 1}:`,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp",
                data: buffer.toString("base64"),
              },
            }
          );
        });

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: this.VISION_SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        });

        const responseContent = message.content[0];
        if (responseContent.type !== "text") {
          throw new APIError("Unexpected response type from Claude");
        }

        console.log("📝 [CLAUDE] Raw vision response:", responseContent.text);

        const cleanedJson = cleanDirtyJsonStr(responseContent.text);
        const result = JSON.parse(cleanedJson);

        console.log("✅ [CLAUDE] Vision analysis complete:", result);
        return result;
      } catch (error) {
        console.error("💥 [CLAUDE] Vision analysis error:", error);
        throw new APIError("Failed to analyze images with Claude");
      }
    });
  }

  async generateSEOContent(request: SEORequest): Promise<SEOData> {
    return retryWithBackoff(async () => {
      try {
        console.log(`🔍 [CLAUDE] Generating SEO for: ${request.productModel}`);

        const prompt = this.buildSEOPrompt(request);

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: this.SEO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });

        const responseContent = message.content[0];
        if (responseContent.type !== "text") {
          throw new APIError("Unexpected response type from Claude");
        }

        console.log("📝 [CLAUDE] Raw SEO response:", responseContent.text);

        const result = parseJSONFromText(responseContent.text);
        console.log("✅ [CLAUDE] SEO generation complete:", result);
        return result as SEOData;
      } catch (error) {
        console.error("💥 [CLAUDE] SEO generation error:", error);
        throw new APIError("Failed to generate SEO content with Claude");
      }
    });
  }

  private buildSEOPrompt(request: SEORequest): string {
    return `Generate SEO-optimized content for this used product listing:

Product: ${request.productModel}
Brand: ${request.specifications.brand}
Category: ${request.specifications.category}
Condition: ${request.condition}
Year: ${request.specifications.yearReleased}
Current Retail Price: $${request.msrpData.currentSellingPrice}
Our Price: $${request.finalPrice}
Key Features: ${request.specifications.keyFeatures.join(", ")}
Description: ${request.specifications.description}

Technical Specs:
${Object.entries(request.specifications.technicalSpecs)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Create SEO content that:
1. Targets buyers searching for this specific product in used/refurbished condition
2. Emphasizes the savings compared to retail price
3. Includes long-tail keywords buyers actually use
4. Highlights key features and condition
5. Creates urgency and trust

Return JSON with this exact structure:
{
  "slug": "used-apple-iphone-15-pro-128gb-titanium-unlocked-excellent-condition",
  "title": "Used Apple iPhone 15 Pro 128GB Titanium - Unlocked, Excellent Condition | Save $200",
  "metaDescription": "Buy used Apple iPhone 15 Pro 128GB in excellent condition. Fully unlocked, tested & guaranteed. Save $200 vs retail. Free shipping & 30-day warranty.",
  "keywords": ["used iPhone 15 Pro", "refurbished iPhone", "unlocked iPhone", "iPhone 15 Pro 128GB"],
  "longTailKeywords": ["used iPhone 15 Pro excellent condition", "refurbished iPhone 15 Pro unlocked", "iPhone 15 Pro 128GB titanium used"],
  "productDescription": "This pre-owned Apple iPhone 15 Pro in stunning Titanium finish offers flagship performance at an unbeatable price. Featuring the powerful A17 Pro chip, professional camera system, and premium titanium design, this device has been thoroughly tested and verified to work like new. With our 30-day warranty and satisfaction guarantee, you can enjoy premium technology while saving hundreds compared to retail price.",
  "bulletPoints": [
    "✅ Excellent condition - minimal signs of use",
    "📱 Fully unlocked - works with all carriers",
    "🔋 Battery health verified at 90%+",
    "📦 Includes original accessories",
    "🛡️ 30-day warranty included",
    "💰 Save $200 vs retail price"
  ],
  "schemaMarkup": {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Used Apple iPhone 15 Pro 128GB Titanium",
    "description": "Pre-owned iPhone 15 Pro in excellent condition",
    "brand": {"@type": "Brand", "name": "Apple"},
    "condition": "https://schema.org/UsedCondition",
    "offers": {
      "@type": "Offer",
      "price": "${request.finalPrice}",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  },
  "tags": ["iPhone", "Apple", "Smartphone", "Used Electronics", "Unlocked Phone"]
}`;
  }
}

// Gemini Service Implementation
export class GeminiService implements SearchService {
  async getMSRPData(productModel: string): Promise<MSRPData> {
    return retryWithBackoff(async () => {
      try {
        console.log(`🔍 [GEMINI] Getting MSRP for: ${productModel}`);

        const prompt = `Find the current selling price for the used product: "${productModel}".

This is for a used product reseller business. Search the web for current market pricing and provide:
1. Current selling price (what this product is actually selling for NEW in retail stores like Amazon, Best Buy, Target, etc.)
2. Original MSRP when first released (if available)
3. Price trend over the last 6 months (increasing/decreasing/stable)

Focus on finding the CURRENT RETAIL PRICE that customers can buy this product NEW today, not historical or used prices.

Return ONLY a JSON object with this exact format:
{
  "currentSellingPrice": 299.99,
  "originalMSRP": 349.99,
  "priceTrend": "decreasing",
  "currency": "USD",
  "lastUpdated": "${new Date().toISOString()}",
  "sources": ["Amazon", "Best Buy", "Target"]
}`;

        const result = await gemini.models.generateContent({
          model: geminiModel,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const responseText = result.text || "";
        console.log("📝 [GEMINI] Raw MSRP response:", responseText);

        const parsedData = parseJSONFromText(responseText);
        console.log("✅ [GEMINI] MSRP data retrieved:", parsedData);
        return parsedData as MSRPData;
      } catch (error) {
        console.error("💥 [GEMINI] MSRP error:", error);
        return this.createFallbackMSRPData();
      }
    });
  }

  async getSpecifications(
    productModel: string
  ): Promise<ProductSpecifications> {
    return retryWithBackoff(async () => {
      try {
        console.log(`🔍 [GEMINI] Getting specifications for: ${productModel}`);

        const prompt = `Find detailed technical specifications and features for the product: "${productModel}".

Search the web for technical specifications and provide:
1. Brand and model name
2. Product category
3. Year released
4. Physical dimensions (length, width, height, weight)
5. Key features and capabilities
6. Technical specifications
7. Model variations if any
8. Brief description

Return ONLY a JSON object with this exact format:
{
  "brand": "Apple",
  "model": "iPhone 15 Pro",
  "category": "Smartphone",
  "yearReleased": "2023",
  "dimensions": {
    "length": "6.1 inches",
    "width": "2.78 inches", 
    "height": "0.32 inches",
    "weight": "7.27 oz"
  },
  "keyFeatures": ["A17 Pro chip", "Titanium design", "Action Button"],
  "technicalSpecs": {"Display": "6.1-inch Super Retina XDR", "Storage": "128GB-1TB"},
  "modelVariations": ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro Max"],
  "description": "Premium smartphone with titanium design"
}`;

        const result = await gemini.models.generateContent({
          model: geminiModel,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const responseText = result.text || "";
        console.log("📝 [GEMINI] Raw specifications response:", responseText);

        const parsedData = parseJSONFromText(responseText);
        console.log("✅ [GEMINI] Specifications retrieved:", parsedData);
        return parsedData as ProductSpecifications;
      } catch (error) {
        console.error("💥 [GEMINI] Specifications error:", error);
        return this.createFallbackSpecifications(productModel);
      }
    });
  }

  async getCompetitiveAnalysis(productModel: string): Promise<CompetitiveData> {
    return retryWithBackoff(async () => {
      try {
        console.log(
          `🔍 [GEMINI] Getting competitive analysis for: ${productModel}`
        );

        const prompt = `Find competitive analysis and marketplace pricing for the product: "${productModel}".

Search for current listings on major marketplaces:
1. eBay (sold listings and active listings)
2. Facebook Marketplace
3. Mercari
4. Amazon (if available)
5. Other relevant marketplaces

Provide:
1. Current average selling prices on each platform
2. Price ranges (lowest to highest)
3. Popular listing conditions (new, used, refurbished)
4. Best platforms for selling this product
5. Market demand indicators

Return ONLY a JSON object with this exact format:
{
  "platforms": {
    "ebay": {
      "averagePrice": 250.00,
      "priceRange": {"low": 200.00, "high": 300.00},
      "activeListings": 45,
      "soldListings": 120
    },
    "facebook": {
      "averagePrice": 230.00,
      "priceRange": {"low": 180.00, "high": 280.00}
    },
    "mercari": {
      "averagePrice": 240.00,
      "priceRange": {"low": 190.00, "high": 290.00}
    }
  },
  "bestPlatforms": ["eBay", "Facebook Marketplace"],
  "marketDemand": "medium",
  "recommendedConditions": ["Used - Good", "Used - Excellent"],
  "insights": "High demand on eBay with good profit margins"
}`;

        const result = await gemini.models.generateContent({
          model: geminiModel,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const responseText = result.text || "";
        console.log("📝 [GEMINI] Raw competitive response:", responseText);

        const parsedData = parseJSONFromText(responseText);
        console.log("✅ [GEMINI] Competitive analysis complete:", parsedData);
        return parsedData as CompetitiveData;
      } catch (error) {
        console.error("💥 [GEMINI] Competitive analysis error:", error);
        return this.createFallbackCompetitiveData(productModel);
      }
    });
  }

  private createFallbackMSRPData(): MSRPData {
    return {
      currentSellingPrice: 0,
      originalMSRP: 0,
      priceTrend: "unknown",
      currency: "USD",
      lastUpdated: new Date().toISOString(),
      sources: [],
    };
  }

  private createFallbackSpecifications(
    productModel: string
  ): ProductSpecifications {
    return {
      brand: "Unknown",
      model: productModel,
      category: "Electronics",
      yearReleased: "Unknown",
      dimensions: {
        length: "Unknown",
        width: "Unknown",
        height: "Unknown",
        weight: "Unknown",
      },
      keyFeatures: ["Feature detection pending"],
      technicalSpecs: { Status: "Specifications being researched" },
      modelVariations: [],
      description: `Technical specifications for ${productModel} are being researched.`,
    };
  }

  private createFallbackCompetitiveData(productModel: string): CompetitiveData {
    return {
      platforms: {
        ebay: {
          averagePrice: 0,
          priceRange: { low: 0, high: 0 },
          activeListings: 0,
          soldListings: 0,
        },
        facebook: {
          averagePrice: 0,
          priceRange: { low: 0, high: 0 },
        },
      },
      bestPlatforms: [],
      marketDemand: "unknown",
      recommendedConditions: [],
      insights: `Unable to retrieve competitive analysis for ${productModel}`,
    };
  }
}

// Service instances
export const claudeService = new ClaudeService();
export const geminiService = new GeminiService();

// Pricing calculation utility (extracted from pricing route)
export function calculatePricingSuggestion(
  request: PricingRequest
): PricingSuggestion {
  console.log(
    `💰 [PRICING] Starting pricing calculation for: ${request.productModel}`
  );

  // Extract non-zero competitive prices
  const competitivePrices = [];

  if (request.competitiveData.platforms.ebay.averagePrice > 0) {
    competitivePrices.push({
      platform: "eBay",
      averagePrice: request.competitiveData.platforms.ebay.averagePrice,
      priceRange: request.competitiveData.platforms.ebay.priceRange,
    });
  }

  if (request.competitiveData.platforms.facebook.averagePrice > 0) {
    competitivePrices.push({
      platform: "Facebook Marketplace",
      averagePrice: request.competitiveData.platforms.facebook.averagePrice,
      priceRange: request.competitiveData.platforms.facebook.priceRange,
    });
  }

  if (competitivePrices.length === 0) {
    // No competitive data available, use retail price as fallback
    const fallbackPrice = request.currentSellingPrice * 0.6;
    return {
      suggestedPrice: Math.round(fallbackPrice),
      priceRange: {
        min: Math.round(fallbackPrice * 0.8),
        max: Math.round(fallbackPrice * 1.2),
      },
      competitivePrices: [],
      pricingStrategy: "Retail-based pricing",
      profitMargin: 0,
      reasoning: [
        "No competitive marketplace data available",
        "Using 60% of current retail price as baseline",
        "Consider researching similar products manually",
      ],
      confidence: 30,
    };
  }

  // Calculate average competitive price
  const avgCompetitivePrice =
    competitivePrices.reduce((sum, p) => sum + p.averagePrice, 0) /
    competitivePrices.length;

  // Condition multipliers
  const conditionMultipliers = {
    new: 0.85,
    excellent: 0.75,
    good: 0.65,
    fair: 0.5,
    poor: 0.35,
  };

  const conditionMultiplier =
    conditionMultipliers[
      request.condition as keyof typeof conditionMultipliers
    ] || 0.65;

  // Base suggested price
  let suggestedPrice = avgCompetitivePrice * conditionMultiplier;

  // Market demand adjustments
  let demandMultiplier = 1.0;
  if (request.competitiveData.marketDemand === "high") {
    demandMultiplier = 1.1;
  } else if (request.competitiveData.marketDemand === "low") {
    demandMultiplier = 0.9;
  }

  suggestedPrice *= demandMultiplier;

  // eBay activity bonus
  const ebayData = request.competitiveData.platforms.ebay;
  if (ebayData.soldListings > 50) {
    suggestedPrice *= 1.05;
  }

  // Calculate price range
  const priceRange = {
    min: Math.round(suggestedPrice * 0.85),
    max: Math.round(suggestedPrice * 1.15),
  };

  // Calculate profit margin vs retail
  const profitMargin =
    request.currentSellingPrice > 0
      ? Math.round(
          ((request.currentSellingPrice - suggestedPrice) /
            request.currentSellingPrice) *
            100
        )
      : 0;

  // Determine pricing strategy
  let pricingStrategy = "Competitive pricing";
  if (suggestedPrice > avgCompetitivePrice) {
    pricingStrategy = "Premium pricing";
  } else if (suggestedPrice < avgCompetitivePrice * 0.8) {
    pricingStrategy = "Aggressive pricing";
  }

  // Generate reasoning
  const reasoning = [
    `Based on ${
      competitivePrices.length
    } marketplace(s) with average price of $${avgCompetitivePrice.toFixed(2)}`,
    `Applied ${Math.round(
      conditionMultiplier * 100
    )}% condition adjustment for "${request.condition}" condition`,
  ];

  if (demandMultiplier !== 1.0) {
    reasoning.push(
      `Applied ${Math.round(
        (demandMultiplier - 1) * 100
      )}% market demand adjustment`
    );
  }

  if (ebayData.soldListings > 50) {
    reasoning.push(
      `Added 5% premium due to high eBay activity (${ebayData.soldListings} sold listings)`
    );
  }

  // Calculate confidence
  let confidence = 50;
  confidence += competitivePrices.length * 15;
  confidence += Math.min(ebayData.soldListings / 10, 20);
  confidence = Math.min(confidence, 95);

  const result = {
    suggestedPrice: Math.round(suggestedPrice),
    priceRange,
    competitivePrices,
    pricingStrategy,
    profitMargin,
    reasoning,
    confidence: Math.round(confidence),
  };

  console.log("💰 [PRICING] Final pricing suggestion:", result);
  return result;
}
