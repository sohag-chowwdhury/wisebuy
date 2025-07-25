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
  ComprehensiveProductAnalysis,
} from "./types";
import { APIError, parseJSONFromText, retryWithBackoff } from "./api-utils";
import { cleanDirtyJsonStr } from "./utils";

// Add WooCommerce category interface
interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

// Add function to fetch WooCommerce categories
async function fetchWooCommerceCategories(): Promise<WooCommerceCategory[]> {
  const { WC_CONSUMER_KEY, WC_CONSUMER_SECRET, WP_DOMAIN } = process.env;

  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !WP_DOMAIN) {
    console.warn("🚨 [WOOCOMMERCE] Credentials not found, using fallback categories");
    const fallbackCategories = [
      { id: 1, name: "Uncategorized", slug: "uncategorized", parent: 0, description: "Default category", count: 0 },
      { id: 2, name: "Electronics", slug: "electronics", parent: 0, description: "", count: 0 },
      { id: 3, name: "Home & Garden", slug: "home-garden", parent: 0, description: "", count: 0 },
      { id: 4, name: "Clothing", slug: "clothing", parent: 0, description: "", count: 0 },
      { id: 5, name: "Sports & Outdoors", slug: "sports-outdoors", parent: 0, description: "", count: 0 },
      { id: 6, name: "Books", slug: "books", parent: 0, description: "", count: 0 },
      { id: 7, name: "Automotive", slug: "automotive", parent: 0, description: "", count: 0 },
      { id: 8, name: "Health & Beauty", slug: "health-beauty", parent: 0, description: "", count: 0 }
    ];
    console.log(`🏪 [FALLBACK] Using ${fallbackCategories.length} fallback categories:`, fallbackCategories.map(cat => `${cat.name} (ID: ${cat.id})`).join(', '));
    return fallbackCategories;
  }

  try {
    const wcAuth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");
    
    const response = await fetch(
      `${WP_DOMAIN}/wp-json/wc/v3/products/categories?per_page=100&orderby=name&order=asc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${wcAuth}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`🚨 [WOOCOMMERCE] API call failed with status ${response.status}, using fallback categories`);
      const fallbackCategories = [
        { id: 1, name: "Uncategorized", slug: "uncategorized", parent: 0, description: "Default category", count: 0 },
        { id: 2, name: "Electronics", slug: "electronics", parent: 0, description: "", count: 0 },
        { id: 3, name: "Home & Garden", slug: "home-garden", parent: 0, description: "", count: 0 },
        { id: 4, name: "Clothing", slug: "clothing", parent: 0, description: "", count: 0 }
      ];
      console.log(`🏪 [FALLBACK] Using ${fallbackCategories.length} fallback categories after API failure`);
      return fallbackCategories;
    }

    const categories: WooCommerceCategory[] = await response.json();
    console.log(`🏪 [WOOCOMMERCE] Fetched ${categories.length} categories:`, categories.map(cat => `${cat.name} (ID: ${cat.id})`).join(', '));
    return categories;
  } catch (error) {
    console.warn("🚨 [WOOCOMMERCE] Error fetching categories:", error);
    const fallbackCategories = [
      { id: 1, name: "Uncategorized", slug: "uncategorized", parent: 0, description: "Default category", count: 0 },
      { id: 2, name: "Electronics", slug: "electronics", parent: 0, description: "", count: 0 },
      { id: 3, name: "Home & Garden", slug: "home-garden", parent: 0, description: "", count: 0 },
      { id: 4, name: "Clothing", slug: "clothing", parent: 0, description: "", count: 0 }
    ];
    console.log(`🏪 [FALLBACK] Using ${fallbackCategories.length} fallback categories after error`);
    return fallbackCategories;
  }
}

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

// Comprehensive Ecommerce Analysis Service interface
export interface ComprehensiveAnalysisService {
  analyzePackagingImages(imageBuffers: Buffer[]): Promise<ComprehensiveProductAnalysis>;
}

// Gemini Service for web search capabilities
export interface SearchService {
  getMSRPData(productModel: string): Promise<MSRPData>;
  getSpecifications(productModel: string): Promise<ProductSpecifications>;
  getCompetitiveAnalysis(productModel: string): Promise<CompetitiveData>;
}

// Claude Service Implementation
export class ClaudeService implements AIService, ComprehensiveAnalysisService {
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

  private readonly COMPREHENSIVE_ANALYSIS_SYSTEM_PROMPT = `You are a product analysis expert specializing in comprehensive ecommerce product analysis. Your task is to analyze product packaging images to extract detailed information for ecommerce listing creation and perform comprehensive competitive pricing research.

## Step-by-Step Analysis Process

### Step 1: Image Analysis
Carefully examine the product packaging and extract the following information directly visible on the package:

**Primary Information:**
- **Brand/Make:** (Look for brand name/logo)
- **Model Number:** (Usually starts with # or Model, may include letters and numbers)
- **Product Name/Description:** (Full product title as shown on package)
- **UPC/Barcode:** (If visible)
- **Item Number:** (Retailer-specific item numbers)

**Dimensions (if visible):**
- **Height:** (in inches and/or centimeters)
- **Width/Length:** (in inches and/or centimeters) 
- **Depth:** (in inches and/or centimeters)
- **Weight:** (if listed on package)

**Additional Package Details:**
- **Package contents/features** (bullets, key features listed)
- **Assembly requirements** (if mentioned)
- **Power requirements** (watts, voltage, etc.)
- **Material specifications** (if listed)

### Step 2: Web Research
Using the brand, model number, and product name identified:

1. **Search for official product page:** Look for manufacturer website or primary retailer
2. **Find complete specifications:** Search for missing dimensions, weight, detailed features
3. **Gather competitive pricing:** Check Amazon, eBay, and other major retailers
4. **Verify product information:** Cross-reference details found online with package information

### Step 3: Competitive Pricing Research (CRITICAL PRIORITY)
Search the following platforms and record current pricing with EXACT URLs:

**Amazon Research:**
- Find current listing price for NEW items
- Check Prime shipping availability (true/false)
- Identify seller type (Amazon, third-party seller name)
- Record customer rating (1-5 stars) and total review count
- **ALWAYS provide search URL:** https://www.amazon.com/s?k=[brand model]
- **If found, provide direct product URL**

 **eBay Research:**
 - Record Buy It Now price range for NEW items (min/max)
 - Record typical USED/auction price range (min/max)
 - Search recent SOLD listings for actual selling prices
 - Calculate average from recent completed sales
 - **If specific product found, provide direct product URL in "url" field**
 - **ALWAYS provide search URLs:**
   - New items search: https://www.ebay.com/sch/i.html?_nkw=[brand model]
   - Sold items search: https://www.ebay.com/sch/i.html?_nkw=[brand model]&LH_Sold=1&LH_Complete=1

**Other Major Retailers:**
- Check Home Depot, Lowe's, Walmart, Target (as applicable to product type)
- Record current prices, sales, clearance pricing
- Note availability status (in stock, out of stock, limited)
- **Provide direct product URLs when found**

**MANDATORY:** Even if exact product not found, ALWAYS provide search result URLs for manual verification

### Step 4: Additional Ecommerce Requirements

**Visual Content Audit:**
- Document package condition (pristine/damaged/shelf wear)
- Identify additional photos needed (lifestyle, detail shots, scale reference)
- Note any missing or damaged components

**Safety & Compliance Check:**
- Look for UL/ETL/CSA safety marks on package/product
- Document electrical specifications (voltage, amperage)
- Check for California Prop 65 or other safety warnings
- Identify country of origin if visible

**Technical Deep Dive:**
- Bulb type and specifications (E26, max wattage, LED compatibility)
- Cord length (measure if accessible)
- Assembly complexity assessment
- Warranty terms (if listed on package)

**Market Positioning Research:**
- Search volume for relevant keywords
- Seasonal demand patterns (if notable)
- Target customer demographics
- Complementary product opportunities

**Logistics Assessment:**
- Package weight (for shipping calculations)
- Fragility level (affects shipping method/insurance)
- Storage requirements
- Return policy implications

Return ONLY valid JSON without any explanatory text, comments, or markdown formatting.`;

  async analyzeImages(imageBuffers: Buffer[]): Promise<ProductAnalysis> {
    return retryWithBackoff(async () => {
      try {
        const content: ContentBlockParam[] = [];
        imageBuffers.forEach((buffer, index) => {
          const mediaType = detectImageMediaType(buffer);

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

        const cleanedJson = cleanDirtyJsonStr(responseContent.text);
        const result = JSON.parse(cleanedJson);
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

        const result = parseJSONFromText(responseContent.text);
        return result as SEOData;
      } catch (error) {
        console.error("💥 [CLAUDE] SEO generation error:", error);
        throw new APIError("Failed to generate SEO content with Claude");
      }
    });
  }

  async analyzePackagingImages(imageBuffers: Buffer[]): Promise<ComprehensiveProductAnalysis> {
    return retryWithBackoff(async () => {
      try {
        // Fetch WooCommerce categories for selection
        const categories = await fetchWooCommerceCategories();
        
        const content: ContentBlockParam[] = [];
        imageBuffers.forEach((buffer, index) => {
          const mediaType = detectImageMediaType(buffer);

          content.push(
            {
              type: "text",
              text: `Packaging Image ${index + 1}:`,
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

        // Add the comprehensive analysis prompt with categories
        content.push({
          type: "text",
          text: this.buildComprehensiveAnalysisPrompt(categories),
        });

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: this.COMPREHENSIVE_ANALYSIS_SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        });

        const responseContent = message.content[0];
        if (responseContent.type !== "text") {
          throw new APIError("Unexpected response type from Claude");
        }

        const cleanedJson = cleanDirtyJsonStr(responseContent.text);
        const result = JSON.parse(cleanedJson);
        
        // Log category selection for debugging
        const categoryName = result.basic_information?.category_name;
        const categoryId = result.basic_information?.category_id;
        console.log(`🏷️ [CLAUDE] Selected category: "${categoryName}" (ID: ${categoryId})`);
        
        // COMPREHENSIVE CATEGORY VALIDATION AND CORRECTION
        console.log(`🏷️ [CLAUDE] Raw AI response - category_name: "${categoryName}", category_id: ${categoryId}`);
        
        // Step 1: Check if AI used exact category from our list
        const exactMatch = categories.find(cat => 
          cat.name === categoryName && cat.id === categoryId
        );
        
        if (exactMatch) {
          console.log(`✅ [CLAUDE] Perfect category match: "${exactMatch.name}" (ID: ${exactMatch.id})`);
        } else {
          console.warn(`⚠️ [CLAUDE] AI created invalid category "${categoryName}" (ID: ${categoryId}), correcting...`);
          
          // Step 2: Try to find category by name similarity (case-insensitive)
          let correctedCategory = categories.find(cat => 
            cat.name.toLowerCase() === categoryName?.toLowerCase()
          );
          
          // Step 3: Smart category mapping for common mistakes
          if (!correctedCategory && categoryName) {
            const categoryLower = categoryName.toLowerCase();
            
            // Coffee makers, kitchen appliances → Home & Kitchen
            if (categoryLower.includes('coffee') || categoryLower.includes('kitchen') || 
                categoryLower.includes('appliance') || categoryLower.includes('blender') ||
                categoryLower.includes('toaster') || categoryLower.includes('microwave')) {
              correctedCategory = categories.find(cat => 
                cat.name.toLowerCase().includes('home') && cat.name.toLowerCase().includes('kitchen') ||
                cat.name.toLowerCase().includes('home & kitchen') ||
                cat.name.toLowerCase().includes('kitchen')
              );
              console.log(`🔧 [CLAUDE] Detected kitchen appliance, mapping to Home & Kitchen category`);
            }
            
            // Electronics mapping
            else if (categoryLower.includes('electronic') || categoryLower.includes('phone') ||
                     categoryLower.includes('computer') || categoryLower.includes('device')) {
              correctedCategory = categories.find(cat => cat.name.toLowerCase().includes('electronics'));
              console.log(`🔧 [CLAUDE] Detected electronics, mapping to Electronics category`);
            }
            
            // Books/Media mapping
            else if (categoryLower.includes('book') || categoryLower.includes('media')) {
              correctedCategory = categories.find(cat => cat.name.toLowerCase().includes('book'));
            }
            
            // Clothing mapping
            else if (categoryLower.includes('clothing') || categoryLower.includes('apparel') ||
                     categoryLower.includes('fashion') || categoryLower.includes('wear')) {
              correctedCategory = categories.find(cat => cat.name.toLowerCase().includes('clothing'));
            }
          }
          
          // Step 4: Final fallback to safe categories
          if (!correctedCategory) {
            const electronicsCategory = categories.find(cat => cat.name.toLowerCase().includes('electronics'));
            const uncategorizedCategory = categories.find(cat => cat.name.toLowerCase().includes('uncategorized'));
            correctedCategory = electronicsCategory || uncategorizedCategory || categories[0];
            console.log(`🔧 [CLAUDE] Using final fallback category: "${correctedCategory.name}"`);
          }
          
          // Apply the correction
          if (correctedCategory) {
            result.basic_information.category_name = correctedCategory.name;
            result.basic_information.category_id = correctedCategory.id;
            console.log(`🔧 [CLAUDE] Corrected to: "${correctedCategory.name}" (ID: ${correctedCategory.id})`);
          }
        }
        
        // Step 5: Final validation - ensure we have valid data
        if (!result.basic_information.category_id || !result.basic_information.category_name) {
          const emergencyCategory = categories[0];
          result.basic_information.category_name = emergencyCategory.name;
          result.basic_information.category_id = emergencyCategory.id;
          console.error(`🚨 [CLAUDE] Emergency fallback applied: "${emergencyCategory.name}" (ID: ${emergencyCategory.id})`);
        }
        
        console.log(`✅ [CLAUDE] Final category: "${result.basic_information?.category_name}" (ID: ${result.basic_information?.category_id})`);
        
        return result as ComprehensiveProductAnalysis;
      } catch (error) {
        console.error("💥 [CLAUDE] Comprehensive packaging analysis error:", error);
        throw new APIError("Failed to analyze packaging images with Claude");
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

  private buildComprehensiveAnalysisPrompt(categories: WooCommerceCategory[]): string {
    const categoryList = categories.map(cat => `- ${cat.name} (ID: ${cat.id})`).join('\n');
    
    // Find fallback categories with better matching
    const homeKitchenCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('home') && cat.name.toLowerCase().includes('kitchen') ||
      cat.name.toLowerCase().includes('home & kitchen') ||
      cat.name.toLowerCase().includes('kitchen')
    );
    const electronicsCategory = categories.find(cat => cat.name.toLowerCase().includes('electronics'));
    const uncategorizedCategory = categories.find(cat => cat.name.toLowerCase().includes('uncategorized'));
    const defaultCategory = electronicsCategory || uncategorizedCategory || categories[0];
    
    // Create specific product-to-category mapping examples
    const productExamples = [];
    if (homeKitchenCategory) {
      productExamples.push(`- Coffee makers, blenders, toasters, kitchen appliances → "${homeKitchenCategory.name}" (ID: ${homeKitchenCategory.id})`);
    }
    if (electronicsCategory) {
      productExamples.push(`- Phones, laptops, TVs, electronic devices → "${electronicsCategory.name}" (ID: ${electronicsCategory.id})`);
    }
    
    return `Analyze the provided product packaging images and perform comprehensive ecommerce analysis following these instructions:

**🚨 ABSOLUTELY CRITICAL CATEGORY SELECTION - THIS IS MANDATORY 🚨**

⚠️ WARNING: You MUST select from the EXACT categories below. DO NOT create new category names like "Coffeemaker" or "Electronics Device". Use ONLY the names provided in this list:

AVAILABLE WOOCOMMERCE CATEGORIES (COPY EXACTLY):
${categoryList}

**🔒 CATEGORY SELECTION RULES - ZERO TOLERANCE FOR DEVIATION:**

1. **IDENTIFY THE PRODUCT** - Look at the packaging and determine what the product is
2. **FIND EXACT MATCH** - Locate the best matching category from the list above
3. **COPY EXACTLY** - Use the EXACT category name and ID as shown above
4. **NO CUSTOM NAMES** - Never invent category names like "Coffeemaker", "Phone Device", etc.
5. **ALWAYS FILL** - Both category_name and category_id must be completed

**🎯 SPECIFIC PRODUCT MAPPING EXAMPLES:**
${productExamples.join('\n')}
- Books, magazines, media → Find "Books" category if available
- Clothing, apparel, fashion → Find "Clothing" category if available
- Tools, hardware → Find "Tools" or "Hardware" category if available
- Unknown/unclear products → "${defaultCategory.name}" (ID: ${defaultCategory.id})

**✅ MANDATORY VALIDATION CHECKLIST:**
Before submitting your response, verify:
1. ✅ Is my category_name copied EXACTLY from the list above?
2. ✅ Is my category_id the matching number from the list above?
3. ✅ Did I avoid creating any custom category names?
4. ✅ Are both fields filled with valid values?

**❌ COMMON MISTAKES TO AVOID:**
- Using "Coffeemaker" instead of "Home & Kitchen"
- Using "Electronics Device" instead of "Electronics"
- Creating any category name not in the provided list
- Leaving category_id as null when category_name is filled

**🆘 EMERGENCY FALLBACK**: If absolutely no category matches, use "${defaultCategory.name}" (ID: ${defaultCategory.id})

**CRITICAL DIMENSION EXTRACTION INSTRUCTIONS:**
When you find dimension text like "5.9 inches", "7.6 inches", "2.3 lbs", etc., you MUST extract the numeric value:
- "5.9 inches" → 5.9 (for width_inches/height_inches/depth_inches)
- "2.3 lbs" → 2.3 (for weight_lbs)
- "15.2 cm" → 15.2 (for height_cm/width_cm/depth_cm)
- "1.1 kg" → 1.1 (for weight_kg)

DO NOT leave dimension fields as null if you can see dimension text on the package or find them through web research.
Parse ALL dimension strings to extract the numeric values only.

Return your analysis in this EXACT JSON format:

   {
    "basic_information": {
      "brand": "",
      "model_number": "",
      "manufacturer": "",
      "product_name": "",
      "category_name": "${defaultCategory.name}",
      "category_id": ${defaultCategory.id},
      "upc": "",
      "item_number": ""
    },
  "specifications": {
    "height_inches": null,
    "height_cm": null,
    "width_inches": null,
    "width_cm": null,
    "depth_inches": null,
    "depth_cm": null,
    "weight_lbs": null,
    "weight_kg": null,
    "weight_source": ""
  },
  "product_description": "",
  "technical_details": {
    "power_requirements": {
      "voltage": "",
      "wattage": "",
      "bulb_type": "",
      "number_of_bulbs": null,
      "led_compatible": null
    },
    "electrical_specs": {
      "cord_length": "",
      "ul_listed": null,
      "etl_listed": null,
      "csa_listed": null
    },
    "assembly": {
      "tools_required": null,
      "estimated_assembly_time": "",
      "difficulty_level": ""
    },
    "materials": {
      "primary_material": "",
      "finish": "",
      "shade_material": ""
    },
    "features": []
  },
  "compliance_and_safety": {
    "country_of_origin": "",
    "prop_65_warning": null,
    "safety_certifications": [],
    "warranty_terms": ""
  },
  "websites_and_documentation": {
    "official_product_page": "",
    "instruction_manual": "",
    "additional_resources": []
  },
  "competitive_pricing": {
    "amazon": {
      "price": null,
      "prime_available": null,
      "seller_type": "",
      "rating": null,
      "review_count": null,
      "url": "",
      "search_results_url": ""
    },
         "ebay": {
       "new_price_range": {
         "min": null,
         "max": null
       },
       "used_price_range": {
         "min": null,
         "max": null
       },
       "recent_sold_average": null,
       "url": "",
       "search_results_url": "",
       "sold_listings_url": ""
     },
    "other_retailers": [
      {
        "retailer": "",
        "price": null,
        "url": "",
        "availability": ""
      }
    ]
  },
  "market_analysis": {
    "target_demographics": [],
    "seasonal_demand": "",
    "complementary_products": [],
    "key_selling_points": []
  },
  "logistics_assessment": {
    "package_condition": "",
    "fragility_level": "",
    "shipping_considerations": "",
    "storage_requirements": "",
    "return_policy_implications": ""
  },
  "visual_content_needs": {
    "additional_photos_needed": [],
    "lifestyle_shots_required": null,
    "detail_shots_required": null
  },
  "pricing_recommendation": {
    "msrp": null,
    "suggested_price_range": {
      "min": null,
      "max": null
    },
    "justification": "",
    "profit_margin_estimate": ""
  },
  "analysis_metadata": {
    "analysis_date": "${new Date().toISOString()}",
    "analyst_notes": "",
    "data_confidence_level": "",
    "missing_information": []
  }
}

**Special Instructions:**
- Use null for numeric fields when data is not available
- Use empty strings "" for text fields when data is not available  
- Use empty arrays [] for list fields when no data is available
- Always include search result URLs even if specific products aren't found
- Set data_confidence_level to "high", "medium", or "low" based on information quality
- Include any missing information in the missing_information array
- Focus on accuracy over speed
- Save search result URLs for manual price comparison

**COMPETITIVE PRICING RESEARCH REQUIREMENTS:**

For the competitive_pricing section, you MUST research and populate with REAL data:

**Amazon Research:**
- Search Amazon for the exact product model/brand
- Record current listing price for NEW items
- Check if Prime shipping is available
- Identify seller type (Amazon direct, third-party, etc.)
- Note customer rating and review count if available
- ALWAYS provide search result URL: "https://www.amazon.com/s?k=[product model]"
- If specific product found, provide direct product URL

 **eBay Research:**
 - Search eBay for both new and used pricing
 - Record Buy It Now price ranges for new items
 - Record typical used/auction price ranges
 - Research recent sold listings to find actual selling prices
 - **If specific product found, provide direct eBay product URL in "url" field**
 - **ALWAYS provide these search URLs:**
   - "search_results_url": "https://www.ebay.com/sch/i.html?_nkw=[product model]"
   - "sold_listings_url": "https://www.ebay.com/sch/i.html?_nkw=[product model]&LH_Sold=1&LH_Complete=1"

**Other Major Retailers:**
- Check Home Depot, Lowe's, Walmart, Target (as applicable to product type)
- Look for current pricing, sales, or clearance prices
- Record availability status
- Provide direct product URLs when found

**CRITICAL:** Even if you cannot find exact pricing, you MUST still provide:
1. Search result URLs for manual review
2. Best estimates based on similar products
3. Clear notes about data confidence level

 **MSRP RESEARCH (CRITICAL):**
 For the pricing_recommendation.msrp field, you MUST research and find:
 - Original Manufacturer Suggested Retail Price (MSRP) when the product was first released
 - Current retail price if still being sold new
 - Search manufacturer websites, official retailers, and product documentation
 - If MSRP not found, provide your best estimate based on similar products and note this in missing_information

**FINAL CATEGORY VALIDATION:**
Before submitting your response, double-check:
1. ✅ Did you select a category_name from the provided list?
2. ✅ Did you include the corresponding category_id number?
3. ✅ If no good match exists, did you use "Not Existing Category - [suggestion]" format?
4. ✅ Are both category_name and category_id fields filled correctly?

**REMEMBER**: Category selection is MANDATORY. Do not leave these fields empty or the system will fail.`;
   }
}

// Gemini Service Implementation
export class GeminiService implements SearchService {
  async getMSRPData(productModel: string): Promise<MSRPData> {
    return retryWithBackoff(async () => {
      try {
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
        const parsedData = parseJSONFromText(responseText);
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
        const prompt = `You are a product research specialist. Find REAL specifications for: "${productModel}"

⚠️ CRITICAL: If the product name is generic (like "Electronic device", "Unknown Model", "Product"), you MUST return an empty keyFeatures array: []

🎯 PRIMARY MISSION: Extract SPECIFIC, REAL product features - NOT generic descriptions!

STOP IMMEDIATELY if the product name/model is:
- "Electronic device" or variations
- "Unknown Model" or "Generic" 
- Just a category name like "Electronics", "Phone", "Laptop"
- Any vague/generic description

If generic product name detected, return:
{
  "brand": "Unknown",
  "model": "Unknown",
  "category": "Electronics", 
  "yearReleased": "",
  "dimensions": {"length": "Unknown", "width": "Unknown", "height": "Unknown", "weight": "Unknown"},
  "keyFeatures": [],
  "technicalSpecs": {},
  "modelVariations": [],
  "description": "Generic product - specific model needed for feature extraction"
}

🔍 SEARCH THESE EXACT SOURCES:
1. Official manufacturer website (Apple.com, Samsung.com, etc.)
2. GSMArena.com (for phones), NotebookCheck.com (for laptops)
3. Amazon product pages (look for "About this item" section)
4. Best Buy, Target product specifications
5. Tech review sites: CNET, TechRadar, The Verge

📋 REQUIRED DATA TO EXTRACT:

**KEY FEATURES** (MOST IMPORTANT - Be very specific):
Examples of GOOD features:
- "A17 Pro chip with 6-core CPU and 6-core GPU"
- "48MP main camera with 2x telephoto and ultra-wide"
- "6.1-inch Super Retina XDR OLED display"
- "5000mAh battery with 25W fast charging"
- "128GB/256GB/512GB storage options"
- "Face ID authentication system"
- "MagSafe wireless charging up to 15W"

Examples of BAD features (DO NOT USE):
- "High quality", "Premium design", "Great performance"
- "Electronic functionality", "User interface", "Quality construction"
- "Advanced technology", "Innovative features", "Cutting-edge"

**OTHER REQUIRED DATA**:
1. **Brand and Model**: Exact official names
2. **Category**: Smartphone, Laptop, Camera, Gaming, Electronics, etc.
3. **Release Year**: When officially announced/released  
4. **Dimensions**: Official measurements in inches
5. **Technical Specs**: Processor, RAM, storage, display, battery, etc.

SEARCH STRATEGY:
- Check manufacturer websites (Apple.com, Samsung.com, etc.)
- Look up tech specs on review sites (GSMArena, NotebookCheck, DisplaySpecifications)
- Search "[product model] specifications dimensions weight release date"
- Find release/launch year from tech news sites (TechCrunch, TheVerge, AnandTech)
- Check retail sites (Amazon, Best Buy) product descriptions for specs

DIMENSION FORMATTING RULES:
- Convert all measurements to inches (e.g., "159.9 mm" → "6.30 inches")
- Include units: "6.30 inches", "8.25 oz", "0.31 inches"  
- For weight: Convert grams to oz (e.g., "234g" → "8.25 oz")
- Use 2 decimal places for precision

YEAR FORMATTING RULES:
- Use 4-digit year format: "2023", "2024", "2019"
- If only month/year known, use the year: "March 2023" → "2023"
- If uncertain about exact year, use "Unknown"

REAL DATA EXAMPLES:
iPhone 15 Pro → length: "6.30 inches", width: "3.02 inches", height: "0.32 inches", weight: "7.27 oz", yearReleased: "2023"
MacBook Air M2 → length: "11.97 inches", width: "8.46 inches", height: "0.44 inches", weight: "2.7 lbs", yearReleased: "2022"

IMPORTANT: If you cannot find real data for any field, use these EXACT values:
- yearReleased: "Unknown" (not estimated years)
- dimensions: {"length": "Unknown", "width": "Unknown", "height": "Unknown", "weight": "Unknown"}

🚨 CRITICAL: The keyFeatures array is the MOST IMPORTANT part. Spend extra effort finding specific, technical features.

For "${productModel}" specifically, search for:
- Processor/chip details (exact model name, cores, speed)
- Camera specifications (megapixels, lens types, zoom capabilities)
- Display details (size, resolution, technology, refresh rate)
- Battery capacity and charging speed
- Storage and RAM options
- Connectivity features (WiFi version, Bluetooth, 5G, etc.)
- Special features unique to this model

Return ONLY a JSON object with this exact format:
{
  "brand": "Apple",
  "model": "iPhone 15 Pro Max", 
  "category": "Smartphone",
  "yearReleased": "2023",
  "dimensions": {
    "length": "6.30 inches",
    "width": "3.02 inches",
    "height": "0.32 inches", 
    "weight": "7.81 oz"
  },
  "keyFeatures": [
    "A17 Pro chip with 6-core CPU and 6-core GPU",
    "48MP main camera with 5x telephoto zoom",
    "6.7-inch Super Retina XDR OLED display with 120Hz",
    "Titanium construction with Ceramic Shield front",
    "USB-C connector with USB 3 support",
    "Action Button replaces Ring/Silent switch",
    "Up to 1TB storage capacity",
    "MagSafe wireless charging up to 15W"
  ],
  "technicalSpecs": {"Display": "6.7-inch Super Retina XDR", "Storage": "256GB-1TB", "RAM": "8GB", "Camera": "48MP main + 12MP ultra-wide + 12MP telephoto"},
  "modelVariations": ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro"],
  "description": "Premium smartphone with titanium design and A17 Pro chip"
}`;

        const result = await gemini.models.generateContent({
          model: geminiModel,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const responseText = result.text || "";
        const parsedData = parseJSONFromText(responseText);
        
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
        const parsedData = parseJSONFromText(responseText);
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
    // Extract any recognizable info from the product model name
    const modelUpper = productModel.toUpperCase();
    const possibleBrand = productModel.split(' ')[0] || 'Unknown';
    const possibleCategory = this.guessCategory(modelUpper);
    
    return {
      brand: possibleBrand,
      model: productModel,
      category: possibleCategory,
      yearReleased: this.extractYear(productModel) || "Unknown",
      dimensions: {
        length: "Not found",
        width: "Not found", 
        height: "Not found",
        weight: "Not found",
      },
      keyFeatures: this.generateBasicFeatures(possibleCategory),
      technicalSpecs: { 
        Brand: possibleBrand,
        Model: productModel,
        Category: possibleCategory,
        Status: "AI specifications extraction in progress" 
      },
      modelVariations: [],
      description: `${productModel} - Product specifications available after AI processing.`,
    };
  }

  private guessCategory(modelName: string): string {
    if (modelName.includes('IPHONE') || modelName.includes('PHONE') || modelName.includes('SAMSUNG')) return 'Smartphone';
    if (modelName.includes('LAPTOP') || modelName.includes('MACBOOK') || modelName.includes('COMPUTER')) return 'Computer';
    if (modelName.includes('TV') || modelName.includes('TELEVISION') || modelName.includes('MONITOR')) return 'Display';
    if (modelName.includes('CAMERA') || modelName.includes('CANON') || modelName.includes('NIKON')) return 'Camera';
    if (modelName.includes('GAME') || modelName.includes('CONSOLE') || modelName.includes('PS5') || modelName.includes('XBOX')) return 'Gaming';
    return 'Electronics';
  }

  private extractYear(productModel: string): string | null {
    // Look for 4-digit years in the product model
    const yearMatch = productModel.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return yearMatch[1];
    }
    
    // Look for generation indicators that might imply years
    const modelUpper = productModel.toUpperCase();
    if (modelUpper.includes('2024') || modelUpper.includes('24')) return '2024';
    if (modelUpper.includes('2023') || modelUpper.includes('23')) return '2023';  
    if (modelUpper.includes('2022') || modelUpper.includes('22')) return '2022';
    if (modelUpper.includes('2021') || modelUpper.includes('21')) return '2021';
    if (modelUpper.includes('2020') || modelUpper.includes('20')) return '2020';
    
    // Look for specific generation indicators
    if (modelUpper.includes('15 PRO') || modelUpper.includes('IPHONE 15')) return '2023';
    if (modelUpper.includes('14 PRO') || modelUpper.includes('IPHONE 14')) return '2022';
    if (modelUpper.includes('13 PRO') || modelUpper.includes('IPHONE 13')) return '2021';
    if (modelUpper.includes('M3') || modelUpper.includes('M2')) return '2022';
    
    return null;
  }

  private generateBasicFeatures(category: string): string[] {
    // Try to generate somewhat meaningful features based on category
    const categoryFeatures: Record<string, string[]> = {
      'Smartphone': [
        'Mobile phone functionality',
        'Touchscreen display interface',
        'Camera system for photos and videos',
        'Wireless connectivity (WiFi, Bluetooth)',
        'Rechargeable battery system'
      ],
      'Computer': [
        'Computing and processing capabilities',
        'Data storage and memory',
        'Input/output connectivity ports',
        'Display interface support',
        'Operating system compatibility'
      ],
      'Camera': [
        'Image capture and recording',
        'Optical lens system',
        'Manual and automatic controls',
        'Memory card storage support',
        'Battery-powered operation'
      ],
      'Gaming': [
        'Gaming performance optimization',
        'Controller input support',
        'Graphics and audio processing',
        'Game library compatibility',
        'Multiplayer connectivity'
      ],
      'Electronics': [
        'Electronic device functionality',
        'Power management system',
        'User interface controls',
        'Built-in safety features',
        'Standard connectivity options'
      ]
    };
    
    return categoryFeatures[category] || categoryFeatures['Electronics'];
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

// Comprehensive analysis service instance
export const comprehensiveAnalysisService = claudeService; // Use Claude for comprehensive analysis

// Pricing calculation utility (extracted from pricing route)
export function calculatePricingSuggestion(
  request: PricingRequest
): PricingSuggestion {
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

  return result;
}
