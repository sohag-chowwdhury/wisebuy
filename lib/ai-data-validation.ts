// lib/ai-data-validation.ts
// Utility functions for validating AI response data before database insertion

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: any;
}

export interface ProductValidationData {
  name?: string | null;
  model?: string | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  aiConfidence?: number;
}

export interface MarketResearchValidationData {
  msrp?: number | null;
  amazon_price?: number | null;
  ebay_price?: number | null;
  competitive_price?: number | null;
  market_demand?: string | null;
  competitor_count?: number | null;
  ai_confidence?: number | null;
}

/**
 * Validate product data before database insertion
 */
export function validateProductData(data: ProductValidationData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cleanedData: any = {};

  // Validate required fields
  if (!data.name && !data.model) {
    errors.push('Product must have either a name or model');
  }

  // Validate name
  if (data.name) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Product name must be a non-empty string');
    } else if (data.name.length < 3) {
      warnings.push('Product name is very short, may need manual review');
      cleanedData.name = data.name.trim();
    } else if (data.name.toLowerCase().includes('unknown') || data.name.toLowerCase().includes('product')) {
      warnings.push('Product name appears to be a placeholder');
      cleanedData.name = null; // Set to null instead of placeholder
    } else {
      cleanedData.name = data.name.trim();
    }
  } else {
    cleanedData.name = null;
  }

  // Validate model
  if (data.model) {
    if (typeof data.model !== 'string' || data.model.trim().length === 0) {
      errors.push('Product model must be a non-empty string');
    } else if (data.model.toLowerCase().includes('unknown') || data.model.length < 2) {
      warnings.push('Product model appears to be invalid or placeholder');
      cleanedData.model = null;
    } else {
      cleanedData.model = data.model.trim();
    }
  } else {
    cleanedData.model = null;
  }

  // Validate brand
  if (data.brand) {
    if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
      warnings.push('Brand is not a valid string');
      cleanedData.brand = null;
    } else if (data.brand.toLowerCase().includes('generic') || data.brand.toLowerCase().includes('unknown')) {
      warnings.push('Brand appears to be a placeholder');
      cleanedData.brand = null;
    } else {
      cleanedData.brand = data.brand.trim();
    }
  } else {
    cleanedData.brand = null;
  }

  // Validate category
  if (data.category) {
    if (typeof data.category !== 'string' || data.category.trim().length === 0) {
      warnings.push('Category is not a valid string');
      cleanedData.category = null;
    } else if (data.category.toLowerCase().includes('general') || data.category.toLowerCase().includes('unknown')) {
      warnings.push('Category appears to be too generic');
      cleanedData.category = null;
    } else {
      cleanedData.category = data.category.trim();
    }
  } else {
    cleanedData.category = null;
  }

  // Validate AI confidence
  if (data.aiConfidence !== undefined && data.aiConfidence !== null) {
    if (typeof data.aiConfidence !== 'number' || data.aiConfidence < 0 || data.aiConfidence > 100) {
      warnings.push('AI confidence is not a valid percentage (0-100)');
      cleanedData.ai_confidence = null;
    } else {
      cleanedData.ai_confidence = Math.round(data.aiConfidence);
    }
  } else {
    cleanedData.ai_confidence = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData
  };
}

/**
 * Validate market research data before database insertion
 */
export function validateMarketResearchData(data: MarketResearchValidationData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cleanedData: any = {};

  // Validate prices
  const priceFields = ['msrp', 'amazon_price', 'ebay_price', 'competitive_price'];
  
  for (const field of priceFields) {
    const value = (data as any)[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || value < 0) {
        warnings.push(`${field} is not a valid price (must be positive number)`);
        cleanedData[field] = null;
      } else if (value > 100000) {
        warnings.push(`${field} seems unusually high (${value})`);
        cleanedData[field] = value;
      } else {
        cleanedData[field] = Math.round(value * 100) / 100; // Round to 2 decimal places
      }
    } else {
      cleanedData[field] = null;
    }
  }

  // Validate market demand
  if (data.market_demand) {
    const validDemandValues = ['high', 'medium', 'low'];
    if (!validDemandValues.includes(data.market_demand.toLowerCase())) {
      warnings.push(`Market demand "${data.market_demand}" is not a valid value`);
      cleanedData.market_demand = null;
    } else {
      cleanedData.market_demand = data.market_demand.toLowerCase();
    }
  } else {
    cleanedData.market_demand = null;
  }

  // Validate competitor count
  if (data.competitor_count !== undefined && data.competitor_count !== null) {
    if (typeof data.competitor_count !== 'number' || data.competitor_count < 0) {
      warnings.push('Competitor count must be a non-negative number');
      cleanedData.competitor_count = null;
    } else {
      cleanedData.competitor_count = Math.floor(data.competitor_count);
    }
  } else {
    cleanedData.competitor_count = null;
  }

  // Validate AI confidence
  if (data.ai_confidence !== undefined && data.ai_confidence !== null) {
    if (typeof data.ai_confidence !== 'number' || data.ai_confidence < 0 || data.ai_confidence > 1) {
      warnings.push('AI confidence should be between 0 and 1');
      cleanedData.ai_confidence = null;
    } else {
      cleanedData.ai_confidence = Math.round(data.ai_confidence * 100) / 100; // Round to 2 decimal places
    }
  } else {
    cleanedData.ai_confidence = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData
  };
}

/**
 * Log validation results for debugging
 */
export function logValidationResults(context: string, validation: ValidationResult): void {
  if (!validation.isValid) {
    console.error(`❌ [VALIDATION] ${context} - Validation failed:`, validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn(`⚠️ [VALIDATION] ${context} - Warnings:`, validation.warnings);
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log(`✅ [VALIDATION] ${context} - Data validated successfully`);
  }
}

/**
 * Check if AI confidence meets minimum threshold
 */
export function meetsConfidenceThreshold(confidence: number | null | undefined, minThreshold: number = 50): boolean {
  if (confidence === null || confidence === undefined) {
    return false;
  }
  return confidence >= minThreshold;
}

/**
 * Determine if product needs manual review based on validation results
 */
export function needsManualReview(validation: ValidationResult, aiConfidence?: number): boolean {
  // Needs review if validation failed
  if (!validation.isValid) {
    return true;
  }
  
  // Needs review if too many warnings
  if (validation.warnings.length >= 5) {
    return true;
  }
  
  // Needs review if AI confidence is too low
  if (aiConfidence !== undefined && aiConfidence < 50) {
    return true;
  }
  
  return false;
} 