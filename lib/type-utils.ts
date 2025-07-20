// lib/type-utils.ts
import { StreamingData } from './types';

/**
 * Valid streaming data types
 */
const VALID_STREAMING_TYPES = [
  'progress',
  'status', 
  'analysis',
  'msrp',
  'specifications',
  'competitive',
  'pricing',
  'seo',
  'complete',
  'error'
] as const;

/**
 * Type-safe parser for streaming JSON data
 */
export function parseStreamingData(jsonString: string): StreamingData | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate that it's a valid StreamingData object
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      // Check if the type is valid
      if (VALID_STREAMING_TYPES.includes(parsed.type)) {
        return parsed as StreamingData;
      }
    }
    
    console.warn('⚠️ Invalid streaming data format:', parsed);
    return null;
  } catch (error) {
    console.warn('⚠️ Failed to parse streaming data:', error);
    return null;
  }
}

/**
 * Type guard to check if streaming data is complete
 */
export function isUploadComplete(data: StreamingData): boolean {
  return data.type === 'complete' && 'result' in data && 
         typeof data.result === 'object' && data.result !== null &&
         'success' in data.result && data.result.success === true;
}

/**
 * Type guard to check if streaming data is an error
 */
export function isUploadError(data: StreamingData): boolean {
  return data.type === 'error';
}

/**
 * Extract product ID from completion data safely
 */
export function extractProductId(data: StreamingData): string | null {
  if (data.type === 'complete' && 'result' in data && 
      typeof data.result === 'object' && data.result !== null &&
      'productId' in data.result && typeof data.result.productId === 'string') {
    return data.result.productId;
  }
  return null;
}

/**
 * Extract error message from error data safely
 */
export function extractErrorMessage(data: StreamingData): string {
  if (data.type === 'error' && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }
  return 'Unknown error occurred';
}

/**
 * Extract progress value safely
 */
export function extractProgress(data: StreamingData): number | null {
  if (data.type === 'progress' && 'value' in data && typeof data.value === 'number') {
    return data.value;
  }
  return null;
}

/**
 * Extract status message safely
 */
export function extractStatusMessage(data: StreamingData): string | null {
  if (data.type === 'status' && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }
  return null;
}