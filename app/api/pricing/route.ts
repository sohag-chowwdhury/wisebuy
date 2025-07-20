import { PricingRequest, PricingSuggestion } from "@/lib/types";
import { calculatePricingSuggestion } from "@/lib/ai-services";
import {
  createAPIResponse,
  validateRequiredFields,
  APIError,
} from "@/lib/api-utils";
import { VALIDATION_RULES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const pricingRequest: PricingRequest = await request.json();

    console.log(
      `💰 [PRICING] Received pricing request for: ${pricingRequest.productModel}`
    );

    // Validate required fields
    const validationError = validateRequiredFields(
      pricingRequest as unknown as Record<string, unknown>,
      VALIDATION_RULES.REQUIRED_FIELDS.PRICING
    );
    if (validationError) {
      throw new APIError(validationError, 400);
    }

    // Validate price is a positive number
    if (pricingRequest.currentSellingPrice < 0) {
      throw new APIError(
        "Current selling price must be a positive number",
        400
      );
    }

    const pricingSuggestion = calculatePricingSuggestion(pricingRequest);

    return createAPIResponse<PricingSuggestion>(pricingSuggestion);
  } catch (error) {
    console.error("💥 [PRICING] Error in pricing API:", error);

    if (error instanceof APIError) {
      return createAPIResponse(undefined, error.message, error.status);
    }

    return createAPIResponse(undefined, "Internal server error", 500);
  }
}
